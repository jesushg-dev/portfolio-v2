import { buildTailoredResumePrompt } from "@/features/resume-engine/lib/ai/tailor-resume-prompt";
import { tailorResumeDocument } from "@/features/resume-engine/lib/ai/tailor-resume";
import { finalizeTailoredResume } from "@/features/resume-engine/lib/finalize-tailor-export";
import { resolveTailorContext } from "@/features/resume-engine/lib/resolve-tailor-context";
import {
  validateTailoredResume,
  readResumeSnapshot,
} from "@/features/resume-engine/lib/tailored-resume-document";
import {
  CvTemplateVersionSchema,
  DEFAULT_CV_TEMPLATE_VERSION,
} from "@/features/resume-engine/lib/template-registry";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma, PrismaClient } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  CvImportDraftSchema,
  PARSER_VERSION,
} from "@/features/cv/lib/cv-import-draft";
import { extractStructuredResume } from "@/features/resume-engine/lib/ai/extract-structured";
import { persistCvImportDraft } from "@/features/resume-engine/lib/import-persist";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import { UploadThingNotConfiguredError } from "@/lib/uploadthing/tenant-uploadthing";
import { fetchUploadDocxSections } from "@/features/resume-engine/lib/fetch-upload-docx";
import { buildImportPromptPackage } from "@/features/resume-engine/lib/ai/prompt-package";
import {
  formatZodParseError,
  parseAiJsonResponse,
} from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  getAvailableAiProviders,
  getDefaultAiProvider,
  loadTenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import { isPdfUpload } from "@/features/resume-engine/lib/parse-pdf-for-import";
import { generateDocxFromStructured } from "@/features/resume-engine/lib/docx/generate-from-structured";
import {
  convertDocxToPdfForTenant,
  isTenantILovePdfConfigured,
  ILovePdfNotConfiguredError,
} from "@/lib/ilovepdf/tenant-ilovepdf";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";
import { processJobDescription } from "@/features/resume-engine/lib/ai/clean-job-description";

const tailorInputSchema = z
  .object({
    applicationId: z.string().optional(),
    jobDescription: z.string().min(20),
    templateVersion: CvTemplateVersionSchema.default(
      DEFAULT_CV_TEMPLATE_VERSION,
    ),
    targetLocale: z.enum(["en", "es", "nl"]).optional(),
    uiLocale: z.enum(["en", "es", "nl"]).optional(),
    tailoredFor: z.string().optional(),
  })
  .strict();

function rethrowTailorExportError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof UploadThingNotConfiguredError) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "UploadThing is not configured. Connect it in Admin → Credentials first.",
    });
  }
  if (error instanceof ILovePdfNotConfiguredError) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "iLovePDF is not configured. Connect your API keys in Admin → Credentials to enable PDF conversions.",
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "Failed to tailor resume",
  });
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

  // If this export has a DOCX file, convert it to PDF via iLovePDF
  if (
    resumeExport.fileUrl &&
    (await isTenantILovePdfConfigured(resumeExport.userId))
  ) {
    try {
      const docxResponse = await fetch(resumeExport.fileUrl);
      if (docxResponse.ok) {
        const docxBuffer = Buffer.from(await docxResponse.arrayBuffer());
        const pdfBuffer = await convertDocxToPdfForTenant(
          resumeExport.userId,
          docxBuffer,
          resumeExport.fileName,
        );
        const pdfFileName = resumeExport.fileName.replace(/\.docx$/i, ".pdf");
        const uploaded = await uploadBufferToUploadThing(
          resumeExport.userId,
          pdfBuffer,
          pdfFileName,
          "application/pdf",
        );
        await db.resumeExport.update({
          where: { id: resumeExport.id },
          data: {
            pdfFileName,
            pdfFileUrl: uploaded.url,
            pdfUploadThingKey: uploaded.key,
          },
        });
        if (resumeExport.applicationId) {
          await db.application.update({
            where: { id: resumeExport.applicationId },
            data: {
              cvFile: {
                name: pdfFileName,
                url: uploaded.url,
                uploadedAt: new Date(),
              },
            },
          });
        }
        return {
          url: uploaded.url,
          fileName: pdfFileName,
        };
      }
    } catch (err) {
      console.error("[ensureStyledPdf] iLovePDF conversion error:", err);
    }
  }

  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message:
      "No PDF available. Connect iLovePDF in Admin → Credentials to convert this resume to PDF.",
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

export const resumeEngineAdminRouter = createTRPCRouter({
  getAiSettings: protectedProcedure.query(async ({ ctx }) => {
    const credentials = await loadTenantAiCredentials(ctx.user.id);
    const providers = getAvailableAiProviders(credentials);
    return {
      providers,
      defaultProvider: getDefaultAiProvider(credentials),
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

        const credentials = await loadTenantAiCredentials(ctx.user.id);
        const { draft, provider } = await extractStructuredResume(
          sections,
          credentials,
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

      const [studioDraft, application, latestExport] = await Promise.all([
        loadCvStructuredDraft(ctx.db, ctx.user.id, {
          locale: fallbackLocale,
          fallbackLocale,
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
        application: application
          ? {
              id: application.id,
              position: application.position,
              companyName: application.company.name,
              companyDescription: application.company.description ?? "",
              description: application.description ?? "",
              location: application.location ?? "",
              salary: application.salary ?? "",
              notes: application.notes ?? "",
            }
          : null,
        latestExport,
      };
    }),

  getTailorPrompt: protectedProcedure
    .input(tailorInputSchema)
    .query(async ({ ctx, input }) => {
      const context = await resolveTailorContext(ctx.db, ctx.user.id, {
        templateId: input.templateVersion,
        targetLocale: input.targetLocale,
        uiLocale: input.uiLocale,
        jobDescription: processJobDescription(input.jobDescription).cleanedText,
      });
      return buildTailoredResumePrompt(context);
    }),
  tailorResume: protectedProcedure
    .input(tailorInputSchema.extend({ provider: aiProviderSchema }))
    .mutation(async ({ ctx, input }) => {
      try {
        const context = await resolveTailorContext(ctx.db, ctx.user.id, {
          templateId: input.templateVersion,
          targetLocale: input.targetLocale,
          uiLocale: input.uiLocale,
          jobDescription: processJobDescription(input.jobDescription)
            .cleanedText,
        });
        const credentials = await loadTenantAiCredentials(ctx.user.id);
        const { document, result, provider } = await tailorResumeDocument(
          context,
          credentials,
          input.provider,
        );
        return await finalizeTailoredResume(ctx.db, ctx.user.id, {
          document,
          result,
          aiProvider: provider,
          jobDescription: context.jobDescription,
          applicationId: input.applicationId,
          tailoredFor: input.tailoredFor,
        });
      } catch (error) {
        rethrowTailorExportError(error);
      }
    }),
  tailorResumeManual: protectedProcedure
    .input(tailorInputSchema.extend({ rawJson: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      const context = await resolveTailorContext(ctx.db, ctx.user.id, {
        templateId: input.templateVersion,
        targetLocale: input.targetLocale,
        uiLocale: input.uiLocale,
        jobDescription: processJobDescription(input.jobDescription).cleanedText,
      });
      let validated;
      try {
        validated = validateTailoredResume(
          parseAiJsonResponse(input.rawJson),
          context,
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Invalid resume JSON",
        });
      }
      return finalizeTailoredResume(ctx.db, ctx.user.id, {
        ...validated,
        aiProvider: "manual",
        jobDescription: context.jobDescription,
        applicationId: input.applicationId,
        tailoredFor: input.tailoredFor,
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
        const pdf = await ensureStyledPdf(ctx.db, resumeExport);
        return {
          url: pdf.url,
          fileName: pdf.fileName,
        };
      }

      const snapshot = readResumeSnapshot(resumeExport.structuredSnapshot);
      if (!snapshot) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No ATS snapshot is available for this export.",
        });
      }

      try {
        if (input.variant === "ats-docx") {
          const buffer = await generateDocxFromStructured(snapshot);
          const fileName = `${stem} - ATS.docx`;
          const uploaded = await uploadBufferToUploadThing(
            ctx.user.id,
            buffer,
            fileName,
            docxMime,
          );
          return { url: uploaded.url, fileName };
        }

        const docxBuffer = await generateDocxFromStructured(snapshot);
        const buffer = await convertDocxToPdfForTenant(
          ctx.user.id,
          docxBuffer,
          `${stem} - ATS.docx`,
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
});
