import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma, PrismaClient } from "@prisma/client";
import { locales } from "@/i18n/config";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  CvImportDraftSchema,
  PARSER_VERSION,
} from "@/features/cv/lib/cv-import-draft";
import { extractStructuredResume } from "@/features/resume-engine/lib/ai/extract-structured";
import { persistCvImportDraft } from "@/features/resume-engine/lib/import-persist";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import { tailorDocxResume } from "@/features/resume-engine/lib/ai/tailor-docx";
import {
  finalizeDocxTailorExport,
  finalizeUploadTailorExport,
} from "@/features/resume-engine/lib/finalize-tailor-export";
import { UploadThingNotConfiguredError } from "@/lib/uploadthing/tenant-uploadthing";
import {
  fetchUploadForTailor,
  fetchUploadDocxSections,
} from "@/features/resume-engine/lib/fetch-upload-docx";
import { resolveTailorBaseDraft } from "@/features/resume-engine/lib/resolve-tailor-base-draft";
import {
  loadCvTemplateForTailor,
  loadCvTemplatePdfBuffer,
} from "@/features/cv/lib/load-cv-template-docx";
import { parsePdfForTailor } from "@/features/resume-engine/lib/pdf/parse-pdf-for-tailor";
import {
  buildDocxTailorPromptPackage,
  buildImportPromptPackage,
  buildStudioDocxTailorPromptPackage,
} from "@/features/resume-engine/lib/ai/prompt-package";
import {
  formatZodParseError,
  parseAiJsonResponse,
} from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  getAvailableAiProviders,
  getDefaultAiProvider,
} from "@/features/resume-engine/lib/ai/providers";
import { CvDocxTailorResultSchema } from "@/features/resume-engine/lib/cv-docx-tailor-result";
import { classifyPolishedResumeFile } from "@/features/resume-engine/lib/classify-polished-resume";
import { isPdfUpload } from "@/features/resume-engine/lib/parse-pdf-for-import";
import { generateDocxFromStructured } from "@/features/resume-engine/lib/docx/generate-from-structured";
import { generateCvPdfFromSnapshot } from "@/features/resume-engine/lib/generate-cv-pdf-from-snapshot";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";

function rethrowTailorExportError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof UploadThingNotConfiguredError) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "UploadThing is not configured. Connect it in Admin → Credentials first.",
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "Failed to tailor resume",
  });
}

async function tailorStudioPdfSidecar(
  jobDescription: string,
  provider: AiProviderName | null | undefined,
  baseDraft?: CvImportDraft | null,
) {
  const parsedPdf = await parsePdfForTailor(await loadCvTemplatePdfBuffer());
  const { result } = await tailorDocxResume(
    parsedPdf.sections,
    jobDescription,
    provider ?? undefined,
    baseDraft ?? undefined,
  );
  return {
    parsedPdf,
    pdfAdaptedSections: result.sections,
  };
}

async function ensureStyledPdf(
  db: PrismaClient,
  resumeExport: Prisma.ResumeExportGetPayload<object>,
): Promise<{ url: string; fileName: string }> {
  if (resumeExport.pdfFileUrl) {
    return {
      url: resumeExport.pdfFileUrl,
      fileName: resumeExport.pdfFileName ?? resumeExport.fileName,
    };
  }

  if (isPdfUpload(resumeExport.fileName, resumeExport.mimeType)) {
    const pdfFileName = resumeExport.pdfFileName ?? resumeExport.fileName;
    const pdfFileUrl = resumeExport.pdfFileUrl ?? resumeExport.fileUrl;
    const pdfUploadThingKey =
      resumeExport.pdfUploadThingKey ?? resumeExport.uploadThingKey;

    if (!resumeExport.pdfFileUrl) {
      await db.resumeExport.update({
        where: { id: resumeExport.id },
        data: {
          pdfFileName,
          pdfFileUrl,
          pdfUploadThingKey,
        },
      });
    }

    return { url: pdfFileUrl, fileName: pdfFileName };
  }

  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message:
      "No styled PDF on this export. Tailor again so cv-template.pdf is rebuilt in place.",
  });
}

const registerUploadSchema = z.object({
  originalFileUrl: z.string().url(),
  uploadThingKey: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
});

const aiProviderSchema = z
  .enum(["claude", "openai", "deepseek", "gemini"])
  .optional();

const localeSchema = z.enum(locales);

function detectLocaleFromJobDescription(input: string): "en" | "es" | "nl" {
  const value = input.toLowerCase();
  const spanishHints = [
    "responsabilidades",
    "requisitos",
    "experiencia",
    "desarrollador",
    "años",
    "puesto",
  ];
  const dutchHints = [
    "ervaring",
    "vereisten",
    "ontwikkelaar",
    "functie",
    "opleiding",
    "vaardigheden",
  ];

  const esScore = spanishHints.reduce(
    (acc, hint) => acc + (value.includes(hint) ? 1 : 0),
    0,
  );
  const nlScore = dutchHints.reduce(
    (acc, hint) => acc + (value.includes(hint) ? 1 : 0),
    0,
  );

  if (esScore > nlScore && esScore > 0) return "es";
  if (nlScore > esScore && nlScore > 0) return "nl";
  return "en";
}

export const resumeEngineAdminRouter = createTRPCRouter({
  getAiSettings: protectedProcedure.query(() => {
    const providers = getAvailableAiProviders();
    return {
      providers,
      defaultProvider: getDefaultAiProvider(),
      hasAutoProviders: providers.length > 0,
    };
  }),

  registerUpload: protectedProcedure
    .input(registerUploadSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cvSourceUpload.create({
        data: {
          userId: ctx.user.id,
          originalFileUrl: input.originalFileUrl,
          uploadThingKey: input.uploadThingKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          source: "upload",
          importStatus: "pending",
          parserVersion: PARSER_VERSION,
        },
      });
    }),

  getImportPrompt: protectedProcedure
    .input(z.object({ uploadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { sections } = await fetchUploadDocxSections(
        ctx.db,
        input.uploadId,
        ctx.user.id,
      );
      return buildImportPromptPackage(sections);
    }),

  submitManualImportDraft: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
        rawJson: z.string().min(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const upload = await ctx.db.cvSourceUpload.findUnique({
        where: { id: input.uploadId },
      });

      if (upload?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      let draft;
      try {
        draft = CvImportDraftSchema.parse(parseAiJsonResponse(input.rawJson));
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: formatZodParseError(error),
        });
      }

      const updated = await ctx.db.cvSourceUpload.update({
        where: { id: upload.id },
        data: {
          parsedDraft: draft,
          detectedLocale: draft.detectedLocale,
          parsedAt: new Date(),
          importStatus: "preview",
          parseError: null,
          parserVersion: PARSER_VERSION,
        },
      });

      return { upload: updated, draft };
    }),

  parseUpload: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
        provider: aiProviderSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { upload, sections } = await fetchUploadDocxSections(
          ctx.db,
          input.uploadId,
          ctx.user.id,
        );

        const { draft, provider } = await extractStructuredResume(
          sections,
          input.provider,
        );

        const updated = await ctx.db.cvSourceUpload.update({
          where: { id: upload.id },
          data: {
            parsedDraft: draft,
            detectedLocale: draft.detectedLocale,
            parsedAt: new Date(),
            importStatus: "preview",
            parseError: null,
            parserVersion: PARSER_VERSION,
          },
        });

        return { upload: updated, draft, provider };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to parse resume";

        await ctx.db.cvSourceUpload.update({
          where: { id: input.uploadId },
          data: {
            importStatus: "failed",
            parseError: message,
          },
        });

        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  getUploadPreview: protectedProcedure
    .input(z.object({ uploadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const upload = await ctx.db.cvSourceUpload.findUnique({
        where: { id: input.uploadId },
      });

      if (upload?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const draft = upload.parsedDraft
        ? CvImportDraftSchema.parse(upload.parsedDraft)
        : null;

      return { upload, draft };
    }),

  updateDraft: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
        draft: CvImportDraftSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const upload = await ctx.db.cvSourceUpload.findUnique({
        where: { id: input.uploadId },
      });

      if (upload?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.cvSourceUpload.update({
        where: { id: upload.id },
        data: {
          parsedDraft: input.draft,
          detectedLocale: input.draft.detectedLocale,
          importStatus: "preview",
        },
      });
    }),

  confirmImport: protectedProcedure
    .input(z.object({ uploadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const upload = await ctx.db.cvSourceUpload.findUnique({
        where: { id: input.uploadId },
      });

      if (upload?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!upload.parsedDraft) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No parsed draft available for this upload.",
        });
      }

      const draft = CvImportDraftSchema.parse(upload.parsedDraft);
      await persistCvImportDraft(ctx.db, ctx.user.id, draft);

      return ctx.db.cvSourceUpload.update({
        where: { id: upload.id },
        data: { importStatus: "imported" },
      });
    }),

  getTailorPageData: protectedProcedure
    .input(z.object({ applicationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.profile.findUnique({
        where: { userId: ctx.user.id },
        select: { defaultLocale: true },
      });
      const fallbackLocale =
        profile?.defaultLocale === "es" || profile?.defaultLocale === "nl"
          ? profile.defaultLocale
          : "en";

      const [studioDraft, uploads, application, latestExport] =
        await Promise.all([
          loadCvStructuredDraft(ctx.db, ctx.user.id, {
            locale: fallbackLocale,
            fallbackLocale,
          }),
          ctx.db.cvSourceUpload.findMany({
            where: {
              userId: ctx.user.id,
              importStatus: { in: ["pending", "preview", "imported"] },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              fileName: true,
              importStatus: true,
              createdAt: true,
            },
          }),
          input.applicationId
            ? ctx.db.application.findFirst({
                where: { id: input.applicationId, userId: ctx.user.id },
                include: { company: true },
              })
            : Promise.resolve(null),
          input.applicationId
            ? ctx.db.resumeExport.findFirst({
                where: {
                  applicationId: input.applicationId,
                  userId: ctx.user.id,
                },
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  fileUrl: true,
                  fileName: true,
                  mimeType: true,
                  pdfFileUrl: true,
                  pdfFileName: true,
                  structuredSnapshot: true,
                  matchAnalysis: true,
                  aiScore: true,
                  pitchSubject: true,
                  pitchBody: true,
                },
              })
            : Promise.resolve(null),
        ]);

      return {
        hasStudioData: Boolean(studioDraft),
        studioPreview: studioDraft
          ? {
              fullName: studioDraft.header.fullName,
              experienceCount: studioDraft.experiences.length,
            }
          : null,
        uploads,
        application: application
          ? {
              id: application.id,
              position: application.position,
              companyName: application.company.name,
              description: application.description ?? "",
            }
          : null,
        latestExport,
      };
    }),

  getTailorPrompt: protectedProcedure
    .input(
      z.object({
        sourceType: z.enum(["studio", "upload"]),
        uploadId: z.string().optional(),
        jobDescription: z.string().min(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.sourceType === "upload") {
        if (!input.uploadId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "uploadId is required when sourceType is upload.",
          });
        }

        const { parsed } = await fetchUploadForTailor(
          ctx.db,
          input.uploadId,
          ctx.user.id,
        );

        return buildDocxTailorPromptPackage(
          parsed.sections,
          input.jobDescription.trim(),
        );
      }

      const [{ draft }, { parsed }] = await Promise.all([
        resolveTailorBaseDraft(
          ctx.db,
          ctx.user.id,
          input.sourceType,
          input.uploadId,
        ),
        loadCvTemplateForTailor(),
      ]);

      return buildStudioDocxTailorPromptPackage(
        parsed.sections,
        draft,
        input.jobDescription.trim(),
      );
    }),

  tailorResume: protectedProcedure
    .input(
      z.object({
        sourceType: z.enum(["studio", "upload"]),
        uploadId: z.string().optional(),
        jobDescription: z.string().min(20),
        applicationId: z.string().optional(),
        provider: aiProviderSchema,
        targetLocale: localeSchema.optional(),
        tailoredFor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const jobDescription = input.jobDescription.trim();
      const preferredLocale =
        input.targetLocale ?? detectLocaleFromJobDescription(jobDescription);

      if (input.sourceType === "upload") {
        if (!input.uploadId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "uploadId is required when sourceType is upload.",
          });
        }

        try {
          const source = await fetchUploadForTailor(
            ctx.db,
            input.uploadId,
            ctx.user.id,
          );

          const { result, provider } = await tailorDocxResume(
            source.parsed.sections,
            jobDescription,
            input.provider,
          );

          return finalizeUploadTailorExport(ctx.db, ctx.user.id, {
            source,
            result,
            aiProvider: provider,
            jobDescription,
            applicationId: input.applicationId,
            tailoredFor: input.tailoredFor,
            targetLocale: result.detectedLocale ?? input.targetLocale,
          });
        } catch (error) {
          rethrowTailorExportError(error);
        }
      }

      const { draft: baseDraft } = await resolveTailorBaseDraft(
        ctx.db,
        ctx.user.id,
        input.sourceType,
        input.uploadId,
        preferredLocale,
      );

      try {
        const { parsed } = await loadCvTemplateForTailor();

        const { result, provider } = await tailorDocxResume(
          parsed.sections,
          jobDescription,
          input.provider,
          baseDraft,
        );

        let parsedPdf;
        let pdfAdaptedSections;
        try {
          const sidecar = await tailorStudioPdfSidecar(
            jobDescription,
            input.provider,
            baseDraft,
          );
          parsedPdf = sidecar.parsedPdf;
          pdfAdaptedSections = sidecar.pdfAdaptedSections;
        } catch (error) {
          console.error("studio PDF tailor failed", error);
        }

        return finalizeDocxTailorExport(ctx.db, ctx.user.id, {
          parsed,
          adaptedSections: result.sections,
          aiScore: result.aiScore,
          matchNotes: result.matchNotes,
          matchAnalysis: result.matchAnalysis,
          aiProvider: provider,
          sourceType: "studio",
          jobDescription,
          applicationId: input.applicationId,
          tailoredFor: input.tailoredFor,
          structuredSnapshot: baseDraft,
          parsedPdf,
          pdfAdaptedSections,
          targetLocale:
            result.detectedLocale ??
            input.targetLocale ??
            baseDraft.detectedLocale,
        });
      } catch (error) {
        rethrowTailorExportError(error);
      }
    }),

  tailorResumeManual: protectedProcedure
    .input(
      z.object({
        sourceType: z.enum(["studio", "upload"]),
        uploadId: z.string().optional(),
        jobDescription: z.string().min(20),
        applicationId: z.string().optional(),
        rawJson: z.string().min(2),
        targetLocale: localeSchema.optional(),
        tailoredFor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const jobDescription = input.jobDescription.trim();
      const preferredLocale =
        input.targetLocale ?? detectLocaleFromJobDescription(jobDescription);

      if (input.sourceType === "upload") {
        if (!input.uploadId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "uploadId is required when sourceType is upload.",
          });
        }

        const source = await fetchUploadForTailor(
          ctx.db,
          input.uploadId,
          ctx.user.id,
        );

        let result;
        try {
          result = CvDocxTailorResultSchema.parse(
            parseAiJsonResponse(input.rawJson),
          );
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: formatZodParseError(error),
          });
        }

        return finalizeUploadTailorExport(ctx.db, ctx.user.id, {
          source,
          result,
          aiProvider: "manual",
          jobDescription,
          applicationId: input.applicationId,
          tailoredFor: input.tailoredFor,
          targetLocale: result.detectedLocale ?? input.targetLocale,
        });
      }

      const { draft: baseDraft } = await resolveTailorBaseDraft(
        ctx.db,
        ctx.user.id,
        input.sourceType,
        input.uploadId,
        preferredLocale,
      );

      const { parsed } = await loadCvTemplateForTailor();

      let result;
      try {
        result = CvDocxTailorResultSchema.parse(
          parseAiJsonResponse(input.rawJson),
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: formatZodParseError(error),
        });
      }

      return finalizeDocxTailorExport(ctx.db, ctx.user.id, {
        parsed,
        adaptedSections: result.sections,
        aiScore: result.aiScore,
        matchNotes: result.matchNotes,
        matchAnalysis: result.matchAnalysis,
        aiProvider: "manual",
        sourceType: "studio",
        jobDescription,
        applicationId: input.applicationId,
        tailoredFor: input.tailoredFor,
        structuredSnapshot: baseDraft,
        targetLocale:
          result.detectedLocale ??
          input.targetLocale ??
          baseDraft.detectedLocale,
      });
    }),

  exportTailoredVariant: protectedProcedure
    .input(
      z.object({
        exportId: z.string(),
        variant: z.enum(["docx", "pdf", "ats-docx", "ats-pdf"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const resumeExport = await ctx.db.resumeExport.findFirst({
        where: { id: input.exportId, userId: ctx.user.id },
      });
      if (!resumeExport) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const stem = resumeExport.fileName.replace(/\.(docx|pdf)$/i, "");
      const docxMime =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (input.variant === "docx") {
        return { url: resumeExport.fileUrl, fileName: resumeExport.fileName };
      }

      if (input.variant === "pdf") {
        if (resumeExport.pdfFileUrl) {
          return {
            url: resumeExport.pdfFileUrl,
            fileName: resumeExport.pdfFileName ?? resumeExport.fileName,
          };
        }
        if (isPdfUpload(resumeExport.fileName, resumeExport.mimeType)) {
          return {
            url: resumeExport.fileUrl,
            fileName: resumeExport.fileName,
          };
        }
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "No styled PDF on this export. Tailor again so cv-template.pdf is rebuilt in place.",
        });
      }

      const parsed = CvImportDraftSchema.safeParse(
        resumeExport.structuredSnapshot,
      );
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No ATS snapshot is available for this export.",
        });
      }

      try {
        if (input.variant === "ats-docx") {
          const buffer = await generateDocxFromStructured(parsed.data);
          const fileName = `${stem} - ATS.docx`;
          const uploaded = await uploadBufferToUploadThing(
            ctx.user.id,
            buffer,
            fileName,
            docxMime,
          );
          return { url: uploaded.url, fileName };
        }

        const buffer = await generateCvPdfFromSnapshot(
          parsed.data,
          parsed.data.detectedLocale,
        );
        const fileName = `${stem} - ATS.pdf`;
        const uploaded = await uploadBufferToUploadThing(
          ctx.user.id,
          buffer,
          fileName,
          "application/pdf",
        );
        return { url: uploaded.url, fileName };
      } catch (error) {
        rethrowTailorExportError(error);
      }
    }),

  generateTailoredPdf: protectedProcedure
    .input(z.object({ exportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resumeExport = await ctx.db.resumeExport.findFirst({
        where: { id: input.exportId, userId: ctx.user.id },
      });
      if (!resumeExport) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const pdf = await ensureStyledPdf(ctx.db, resumeExport);
      return { pdfDownloadUrl: pdf.url, pdfFileName: pdf.fileName };
    }),

  replacePolishedResume: protectedProcedure
    .input(
      z.object({
        exportId: z.string().optional(),
        applicationId: z.string().optional(),
        originalFileUrl: z.string().url(),
        uploadThingKey: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const kind = classifyPolishedResumeFile(input.fileName, input.mimeType);

      let resumeExport = input.exportId
        ? await ctx.db.resumeExport.findFirst({
            where: { id: input.exportId, userId: ctx.user.id },
          })
        : null;

      if (!resumeExport && input.applicationId) {
        resumeExport = await ctx.db.resumeExport.findFirst({
          where: {
            applicationId: input.applicationId,
            userId: ctx.user.id,
          },
          orderBy: { createdAt: "desc" },
        });
      }

      if (!resumeExport) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No tailored resume found to replace. Generate one first.",
        });
      }

      const pdfFileName =
        kind === "pdf"
          ? input.fileName
          : resumeExport.fileName.replace(/\.docx$/i, ".pdf");

      const updated = await ctx.db.resumeExport.update({
        where: { id: resumeExport.id },
        data:
          kind === "pdf"
            ? {
                pdfFileName,
                pdfFileUrl: input.originalFileUrl,
                pdfUploadThingKey: input.uploadThingKey,
              }
            : {
                fileName: resumeExport.fileName.endsWith(".docx")
                  ? resumeExport.fileName
                  : `${resumeExport.fileName.replace(/\.[^.]+$/, "")}.docx`,
                fileUrl: input.originalFileUrl,
                uploadThingKey: input.uploadThingKey,
                mimeType: input.mimeType,
                pdfFileName: null,
                pdfFileUrl: null,
                pdfUploadThingKey: null,
              },
      });

      if (updated.applicationId) {
        await ctx.db.application.update({
          where: { id: updated.applicationId },
          data: {
            cvFile: {
              name: kind === "pdf" ? pdfFileName : updated.fileName,
              url: kind === "pdf" ? input.originalFileUrl : updated.fileUrl,
              uploadedAt: new Date(),
            },
          },
        });
      }

      return {
        exportId: updated.id,
        downloadUrl: updated.fileUrl,
        fileName: updated.fileName,
        pdfDownloadUrl: updated.pdfFileUrl,
        pdfFileName: updated.pdfFileName,
        kind,
      };
    }),
});
