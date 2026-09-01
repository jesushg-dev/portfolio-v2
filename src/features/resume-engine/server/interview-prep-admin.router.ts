import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { CvImportDraftSchema } from "@/features/cv/lib/cv-import-draft";
import {
  formatZodParseError,
  parseAiJsonResponse,
} from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  getAvailableAiProviders,
  getDefaultAiProvider,
} from "@/features/resume-engine/lib/ai/providers";
import { generateInterviewPrepPack } from "@/features/resume-engine/lib/ai/generate-interview-prep";
import { buildInterviewPrepPromptPackage } from "@/features/resume-engine/lib/ai/interview-prep-prompt-package";
import { resolveInterviewPrepContext } from "@/features/resume-engine/lib/resolve-interview-prep-context";
import { persistInterviewPrepQuestions } from "@/features/resume-engine/lib/persist-interview-prep";
import {
  InterviewPrepEventTypeSchema,
  InterviewPrepResultSchema,
} from "@/features/resume-engine/lib/interview-prep-result";
import { InterviewPrepCategorySchema } from "@/features/resume-engine/lib/interview-prep-result";

const aiProviderSchema = z
  .enum(["claude", "openai", "deepseek", "gemini"])
  .optional();

const eventIdInput = z.object({
  applicationId: z.string(),
  eventId: z.string(),
});

function mapQuestion(row: {
  id: string;
  eventId: string;
  category: string;
  question: string;
  whyTheyAsk: string;
  modelAnswer: string;
  talkingPoints: string[];
  evidenceFromCv: string[];
  avoid: string[];
  createdAt: Date;
}) {
  return {
    id: row.id,
    eventId: row.eventId,
    category: InterviewPrepCategorySchema.catch("role").parse(row.category),
    question: row.question,
    whyTheyAsk: row.whyTheyAsk,
    modelAnswer: row.modelAnswer,
    talkingPoints: row.talkingPoints,
    evidenceFromCv: row.evidenceFromCv,
    avoid: row.avoid,
    createdAt: row.createdAt,
  };
}

export const interviewPrepAdminRouter = createTRPCRouter({
  getAiSettings: protectedProcedure.query(() => {
    const providers = getAvailableAiProviders();
    return {
      providers,
      defaultProvider: getDefaultAiProvider(),
      hasAutoProviders: providers.length > 0,
    };
  }),

  getInterviewPrepPageData: protectedProcedure
    .input(z.object({ applicationId: z.string(), eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, userId: ctx.user.id },
        include: { company: true },
      });

      if (!application) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const event = await ctx.db.applicationEvent.findFirst({
        where: {
          id: input.eventId,
          applicationId: application.id,
          userId: ctx.user.id,
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [latestExport, storedQuestions] = await Promise.all([
        ctx.db.resumeExport.findFirst({
          where: { applicationId: application.id, userId: ctx.user.id },
          orderBy: { createdAt: "desc" },
          select: {
            structuredSnapshot: true,
            jobDescription: true,
          },
        }),
        ctx.db.interviewPrepQuestion.findMany({
          where: {
            eventId: event.id,
            userId: ctx.user.id,
          },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      const snapshot = latestExport
        ? CvImportDraftSchema.safeParse(latestExport.structuredSnapshot)
        : null;

      const jdLength = Math.max(
        application.description?.trim().length ?? 0,
        latestExport?.jobDescription?.trim().length ?? 0,
      );

      return {
        position: application.position,
        companyName: application.company.name,
        hasJobDescription: jdLength >= 20,
        hasTailoredSnapshot: Boolean(snapshot?.success),
        event: {
          id: event.id,
          type: InterviewPrepEventTypeSchema.catch("INTERVIEW").parse(
            event.type,
          ),
          title: event.title,
          scheduledDate: event.scheduledDate,
          completed: event.completed,
        },
        questions: storedQuestions.map(mapQuestion),
      };
    }),

  getInterviewPrepPrompt: protectedProcedure
    .input(eventIdInput.extend({ append: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const context = await resolveInterviewPrepContext(
        ctx.db,
        ctx.user.id,
        input.applicationId,
        input.eventId,
      );

      const existing = input.append
        ? await ctx.db.interviewPrepQuestion.findMany({
            where: { eventId: input.eventId, userId: ctx.user.id },
            select: { question: true },
            orderBy: { createdAt: "asc" },
          })
        : [];

      return buildInterviewPrepPromptPackage(
        context.draft,
        context.jobDescription,
        context.matchAnalysis,
        {
          position: context.position,
          companyName: context.companyName,
          eventType: context.event.type,
          eventTitle: context.event.title,
          eventNotes: context.event.notes,
          existingQuestions: existing.map((row) => row.question),
        },
      );
    }),

  generateInterviewPrep: protectedProcedure
    .input(
      eventIdInput.extend({
        provider: aiProviderSchema,
        replace: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const context = await resolveInterviewPrepContext(
        ctx.db,
        ctx.user.id,
        input.applicationId,
        input.eventId,
      );

      const existing = input.replace
        ? []
        : await ctx.db.interviewPrepQuestion.findMany({
            where: { eventId: input.eventId, userId: ctx.user.id },
            select: { question: true },
            orderBy: { createdAt: "asc" },
          });

      const { result, provider } = await generateInterviewPrepPack(
        context.draft,
        context.jobDescription,
        context.matchAnalysis,
        {
          position: context.position,
          companyName: context.companyName,
          eventType: context.event.type,
          eventTitle: context.event.title,
          eventNotes: context.event.notes,
          existingQuestions: existing.map((row) => row.question),
        },
        input.provider,
      );

      const questions = await persistInterviewPrepQuestions(ctx.db, {
        userId: ctx.user.id,
        applicationId: context.applicationId,
        eventId: context.event.id,
        result,
        provider,
        replace: input.replace,
      });

      return { questions };
    }),

  generateInterviewPrepManual: protectedProcedure
    .input(
      eventIdInput.extend({
        rawJson: z.string().min(2),
        replace: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const context = await resolveInterviewPrepContext(
        ctx.db,
        ctx.user.id,
        input.applicationId,
        input.eventId,
      );

      let result;
      try {
        result = InterviewPrepResultSchema.parse(
          parseAiJsonResponse(input.rawJson),
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: formatZodParseError(error),
        });
      }

      const questions = await persistInterviewPrepQuestions(ctx.db, {
        userId: ctx.user.id,
        applicationId: context.applicationId,
        eventId: context.event.id,
        result,
        provider: "manual",
        replace: input.replace,
      });

      return { questions };
    }),
});
