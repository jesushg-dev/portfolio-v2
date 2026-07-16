import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  CvImportDraftSchema,
  PARSER_VERSION,
} from "@/features/resume-engine/lib/cv-import-draft";
import { extractStructuredResume } from "@/features/resume-engine/lib/ai/extract-structured";
import { persistCvImportDraft } from "@/features/resume-engine/lib/import-persist";
import { loadCvStructuredDraft } from "@/features/resume-engine/lib/load-cv-structured-draft";
import { tailorDocxResume } from "@/features/resume-engine/lib/ai/tailor-docx";
import { finalizeDocxTailorExport } from "@/features/resume-engine/lib/finalize-tailor-export";
import {
  fetchUploadDocxForTailor,
  fetchUploadDocxSections,
} from "@/features/resume-engine/lib/fetch-upload-docx";
import { resolveTailorBaseDraft } from "@/features/resume-engine/lib/resolve-tailor-base-draft";
import { loadCvTemplateForTailor } from "@/features/resume-engine/lib/load-cv-template-docx";
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
      const [studioDraft, uploads, application] = await Promise.all([
        loadCvStructuredDraft(ctx.db, ctx.user.id),
        ctx.db.cvSourceUpload.findMany({
          where: {
            userId: ctx.user.id,
            importStatus: { in: ["preview", "imported"] },
            parsedDraft: { not: null },
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

        const { parsed } = await fetchUploadDocxForTailor(
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
        tailoredFor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const jobDescription = input.jobDescription.trim();

      if (input.sourceType === "upload") {
        if (!input.uploadId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "uploadId is required when sourceType is upload.",
          });
        }

        try {
          const { upload, parsed } = await fetchUploadDocxForTailor(
            ctx.db,
            input.uploadId,
            ctx.user.id,
          );

          const { result, provider } = await tailorDocxResume(
            parsed.sections,
            jobDescription,
            input.provider,
          );

          return finalizeDocxTailorExport(ctx.db, ctx.user.id, {
            parsed,
            adaptedSections: result.sections,
            aiScore: result.aiScore,
            matchNotes: result.matchNotes,
            aiProvider: provider,
            sourceType: "upload",
            sourceUploadId: upload.id,
            jobDescription,
            applicationId: input.applicationId,
            tailoredFor: input.tailoredFor,
            baseFileName: upload.fileName,
            structuredSnapshot: upload.parsedDraft ?? undefined,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to tailor resume";
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
        }
      }

      const { draft: baseDraft } = await resolveTailorBaseDraft(
        ctx.db,
        ctx.user.id,
        input.sourceType,
        input.uploadId,
      );

      try {
        const { parsed, fileName } = await loadCvTemplateForTailor();

        const { result, provider } = await tailorDocxResume(
          parsed.sections,
          jobDescription,
          input.provider,
          baseDraft,
        );

        return finalizeDocxTailorExport(ctx.db, ctx.user.id, {
          parsed,
          adaptedSections: result.sections,
          aiScore: result.aiScore,
          matchNotes: result.matchNotes,
          aiProvider: provider,
          sourceType: "studio",
          jobDescription,
          applicationId: input.applicationId,
          tailoredFor: input.tailoredFor,
          baseFileName: fileName,
          structuredSnapshot: baseDraft,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to tailor resume";
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
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
        tailoredFor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const jobDescription = input.jobDescription.trim();

      if (input.sourceType === "upload") {
        if (!input.uploadId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "uploadId is required when sourceType is upload.",
          });
        }

        const { upload, parsed } = await fetchUploadDocxForTailor(
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

        return finalizeDocxTailorExport(ctx.db, ctx.user.id, {
          parsed,
          adaptedSections: result.sections,
          aiScore: result.aiScore,
          matchNotes: result.matchNotes,
          aiProvider: "manual",
          sourceType: "upload",
          sourceUploadId: upload.id,
          jobDescription,
          applicationId: input.applicationId,
          tailoredFor: input.tailoredFor,
          baseFileName: upload.fileName,
          structuredSnapshot: upload.parsedDraft ?? undefined,
        });
      }

      const { draft: baseDraft } = await resolveTailorBaseDraft(
        ctx.db,
        ctx.user.id,
        input.sourceType,
        input.uploadId,
      );

      const { parsed, fileName } = await loadCvTemplateForTailor();

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
        aiProvider: "manual",
        sourceType: "studio",
        jobDescription,
        applicationId: input.applicationId,
        tailoredFor: input.tailoredFor,
        baseFileName: fileName,
        structuredSnapshot: baseDraft,
      });
    }),
});
