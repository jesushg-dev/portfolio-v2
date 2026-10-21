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
  loadTenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import { generateInterviewPrepPack } from "@/features/resume-engine/lib/ai/generate-interview-prep";
import { evaluateInterviewAnswer } from "@/features/resume-engine/lib/ai/evaluate-interview-answer";
import { buildInterviewPrepPromptPackage } from "@/features/resume-engine/lib/ai/interview-prep-prompt-package";
import { resolveInterviewPrepContext } from "@/features/resume-engine/lib/resolve-interview-prep-context";
import { persistInterviewPrepQuestions } from "@/features/resume-engine/lib/persist-interview-prep";
import {
  InterviewPrepEventTypeSchema,
  InterviewPrepResultSchema,
} from "@/features/resume-engine/lib/interview-prep-result";
import { InterviewPrepCategorySchema } from "@/features/resume-engine/lib/interview-prep-result";

import { extractJobTools } from "@/features/resume-engine/lib/extract-job-tools";
import { parseMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";

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
  getAiSettings: protectedProcedure.query(async ({ ctx }) => {
    const credentials = await loadTenantAiCredentials(ctx.user.id);
    const providers = getAvailableAiProviders(credentials);
    return {
      providers,
      defaultProvider: getDefaultAiProvider(credentials),
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
            matchAnalysis: true,
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

      const exportJd = latestExport?.jobDescription?.trim();
      const appJd = application.description?.trim();
      const jd = exportJd && exportJd.length > 0 ? exportJd : (appJd ?? "");

      const snapshotSkills = snapshot?.success
        ? snapshot.data.skills.flatMap((s) => s.items)
        : [];
      const matchKeywords = latestExport?.matchAnalysis
        ? (parseMatchAnalysis(latestExport.matchAnalysis)?.keywords ?? []).map(
            (k) => k.term,
          )
        : [];

      const suggestedTools = extractJobTools(jd, snapshotSkills, matchKeywords);

      const jdLength = jd.length;

      return {
        position: application.position,
        companyName: application.company.name,
        hasJobDescription: jdLength >= 20,
        hasTailoredSnapshot: Boolean(snapshot?.success),
        suggestedTools,
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
    .input(
      eventIdInput.extend({
        append: z.boolean().optional(),
        focusTools: z.array(z.string()).optional(),
      }),
    )
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
          focusTools: input.focusTools,
        },
      );
    }),

  generateInterviewPrep: protectedProcedure
    .input(
      eventIdInput.extend({
        provider: aiProviderSchema,
        replace: z.boolean(),
        focusTools: z.array(z.string()).optional(),
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

      const credentials = await loadTenantAiCredentials(ctx.user.id);
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
          focusTools: input.focusTools,
        },
        credentials,
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

  createManualQuestion: protectedProcedure
    .input(
      eventIdInput.extend({
        category: InterviewPrepCategorySchema.default("role"),
        question: z.string().min(3),
        whyTheyAsk: z.string().default(""),
        modelAnswer: z.string().min(3),
        talkingPoints: z.array(z.string()).default([]),
        evidenceFromCv: z.array(z.string()).default([]),
        avoid: z.array(z.string()).default([]),
        locale: z.string().default("es"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, userId: ctx.user.id },
      });
      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      const created = await ctx.db.interviewPrepQuestion.create({
        data: {
          userId: ctx.user.id,
          applicationId: input.applicationId,
          eventId: input.eventId,
          category: input.category,
          question: input.question,
          whyTheyAsk: input.whyTheyAsk,
          modelAnswer: input.modelAnswer,
          talkingPoints: input.talkingPoints,
          evidenceFromCv: input.evidenceFromCv,
          avoid: input.avoid,
          locale: input.locale,
          provider: "manual",
        },
      });

      return { question: mapQuestion(created) };
    }),

  evaluateAnswer: protectedProcedure
    .input(
      z.object({
        questionId: z.string(),
        question: z.string(),
        whyTheyAsk: z.string(),
        modelAnswer: z.string(),
        userAnswer: z.string().min(3),
        talkingPoints: z.array(z.string()).optional(),
        provider: aiProviderSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const credentials = await loadTenantAiCredentials(ctx.user.id);
      const { result, provider } = await evaluateInterviewAnswer(
        {
          question: input.question,
          whyTheyAsk: input.whyTheyAsk,
          modelAnswer: input.modelAnswer,
          userAnswer: input.userAnswer,
          talkingPoints: input.talkingPoints,
        },
        credentials,
        input.provider,
      );

      return { evaluation: result, provider };
    }),
});
