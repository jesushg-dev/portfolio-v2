import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";

import {
  createEmailOpenTrackingToken,
  hashEmailOpenTrackingToken,
} from "@/features/job-tracker/lib/email-open-tracking";
import { getServerBaseUrl } from "@/lib/url/get-base-url";
import { locales } from "@/i18n/config";
import { assertNonEmptyUserId } from "@/lib/admin/get-authenticated-user-id";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import { extractStringFilter } from "@/lib/admin/filter-utils";
import {
  mapApplicationToDetailDto,
  mapApplicationToEditorDto,
  mapApplicationsToListDto,
  applicationListInclude,
  type ApplicationStatus,
} from "@/features/job-tracker/lib/application-editor-dto";
import {
  mapCompaniesToEditorDto,
  mapCompanyToEditorDto,
} from "@/features/job-tracker/lib/company-editor-dto";
import { ghostNudgeSnoozeUntil } from "@/features/job-tracker/lib/stale-application";
import { ImportFromUrlError } from "@/features/job-tracker/lib/import-from-url-errors";
import { importJobFromUrl } from "@/features/job-tracker/lib/import-job-from-url";
import { draftApplicationEmailWithAi } from "@/features/job-tracker/lib/ai/run-draft-application-email";
import { buildApplicationCoverLetterPromptPackage } from "@/features/job-tracker/lib/ai/draft-application-cover-letter";
import { draftApplicationCoverLetterWithAi } from "@/features/job-tracker/lib/ai/run-draft-application-cover-letter";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import { loadTailorJobContext } from "@/features/resume-engine/lib/ai/tailor-job-context";
import { getPortfolioEmailClient } from "@/lib/email/resend";
import { getTenantIntegrationConfig } from "@/lib/integrations/tenant-integrations-service";
import { formatZodParseError } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  getAvailableAiProviders,
  getDefaultAiProvider,
  loadTenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import {
  deleteApplicationEventFromGoogleCalendar,
  pullLinkedUpcomingEventsFromGoogle,
  pushApplicationEventToGoogleCalendar,
  updateApplicationEventOnGoogleCalendar,
} from "@/lib/google-calendar/sync";
import { getGoogleCalendarConnectionForUser } from "@/lib/google-calendar/connection";

const ApplicationStatusSchema = z.enum([
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "GHOSTED",
  "REJECTED",
  "HIRED",
]);

const EventTypeSchema = z.enum([
  "INTERVIEW",
  "TECHNICAL_TEST",
  "QUESTIONNAIRE",
  "PHONE_CALL",
  "MEETING",
  "FOLLOW_UP",
]);

const cvFileSchema = z.object({
  name: z.string(),
  url: z.string(),
  uploadedAt: z.date(),
});

function buildApplicationWhere(
  userId: string,
  filters?: z.infer<typeof dataTableParamsSchema>["filters"],
): Prisma.ApplicationWhereInput {
  assertNonEmptyUserId(userId);
  const where: Prisma.ApplicationWhereInput = { userId };

  const positionVal = extractStringFilter(filters, "position");
  if (positionVal) {
    where.position = { contains: positionVal, mode: "insensitive" };
  }

  const companyVal = extractStringFilter(filters, "company");
  if (companyVal) {
    where.company = {
      name: { contains: companyVal, mode: "insensitive" },
    };
  }

  const statusVal = extractStringFilter(filters, "status");
  if (statusVal) {
    where.status = statusVal;
  }

  return where;
}

function buildCompanyWhere(
  userId: string,
  filters?: z.infer<typeof dataTableParamsSchema>["filters"],
): Prisma.CompanyWhereInput {
  assertNonEmptyUserId(userId);
  const where: Prisma.CompanyWhereInput = { userId };

  const nameVal = extractStringFilter(filters, "name");
  if (nameVal) {
    where.name = { contains: nameVal, mode: "insensitive" };
  }

  const emailVal = extractStringFilter(filters, "email");
  if (emailVal) {
    where.email = { contains: emailVal, mode: "insensitive" };
  }

  return where;
}

function buildApplicationOrderBy(
  sort?: z.infer<typeof dataTableParamsSchema>["sort"],
): Prisma.ApplicationOrderByWithRelationInput {
  if (sort && sort.length > 0) {
    const sortField = sort[0];
    if (sortField.id === "position") {
      return { position: sortField.desc ? "desc" : "asc" };
    }
    if (sortField.id === "appliedDate") {
      return { appliedDate: sortField.desc ? "desc" : "asc" };
    }
    if (sortField.id === "status") {
      return { status: sortField.desc ? "desc" : "asc" };
    }
  }
  return { appliedDate: "desc" };
}

function buildCompanyOrderBy(
  sort?: z.infer<typeof dataTableParamsSchema>["sort"],
): Prisma.CompanyOrderByWithRelationInput {
  if (sort && sort.length > 0) {
    const sortField = sort[0];
    if (sortField.id === "name") {
      return { name: sortField.desc ? "desc" : "asc" };
    }
    if (sortField.id === "createdAt") {
      return { createdAt: sortField.desc ? "desc" : "asc" };
    }
  }
  return { createdAt: "desc" };
}

export const jobTrackerAdminRouter = createTRPCRouter({
  getApplications: protectedProcedure
    .input(dataTableParamsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      const where = buildApplicationWhere(userId, input.filters);
      const orderBy = buildApplicationOrderBy(input.sort);

      const [applications, totalCount] = await Promise.all([
        ctx.db.application.findMany({
          where,
          include: applicationListInclude,
          orderBy,
          skip,
          take,
        }),
        ctx.db.application.count({ where }),
      ]);

      return {
        data: mapApplicationsToListDto(applications),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  getApplicationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.db.application.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          company: true,
          events: { orderBy: { scheduledDate: "asc" } },
        },
      });

      if (!application) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return mapApplicationToDetailDto(application);
    }),

  getCompanies: protectedProcedure
    .input(dataTableParamsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      const where = buildCompanyWhere(userId, input.filters);
      const orderBy = buildCompanyOrderBy(input.sort);

      const [companies, totalCount] = await Promise.all([
        ctx.db.company.findMany({
          where,
          orderBy,
          skip,
          take,
        }),
        ctx.db.company.count({ where }),
      ]);

      return {
        data: mapCompaniesToEditorDto(companies),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const [totalApplications, totalCompanies, statusCounts] = await Promise.all(
      [
        ctx.db.application.count({ where: { userId } }),
        ctx.db.company.count({ where: { userId } }),
        ctx.db.application.groupBy({
          by: ["status"],
          where: { userId },
          _count: true,
        }),
      ],
    );

    const countByStatus = (status: ApplicationStatus) =>
      statusCounts.find((s) => s.status === status)?._count ?? 0;

    return {
      totalApplications,
      totalCompanies,
      applied: countByStatus("APPLIED"),
      inProgress: countByStatus("INTERVIEW"),
      offers: countByStatus("OFFER"),
      ghosted: countByStatus("GHOSTED"),
      rejected: countByStatus("REJECTED"),
      hired: countByStatus("HIRED"),
    };
  }),

  getUpcomingEvents: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.applicationEvent.findMany({
        where: {
          userId: ctx.user.id,
          completed: false,
          scheduledDate: { gt: new Date() },
        },
        include: {
          application: {
            include: { company: true },
          },
        },
        orderBy: { scheduledDate: "asc" },
        take: input.limit,
      });

      const pulled = await pullLinkedUpcomingEventsFromGoogle(
        ctx.user.id,
        events.map((event) => ({
          id: event.id,
          title: event.title,
          googleEventId: event.googleEventId,
          googleEtag: event.googleEtag,
          scheduledDate: event.scheduledDate,
          duration: event.duration,
          location: event.location,
          meetingLink: event.meetingLink,
        })),
      );

      const pulledById = new Map(pulled.map((event) => [event.id, event]));

      return events.map((event) => {
        const synced = pulledById.get(event.id);
        return {
          id: event.id,
          type: event.type,
          title: synced?.title ?? event.title,
          description: event.description,
          scheduledDate: synced?.scheduledDate ?? event.scheduledDate,
          duration: synced?.duration ?? event.duration,
          location: synced?.location ?? event.location,
          isVirtual: event.isVirtual,
          meetingLink: synced?.meetingLink ?? event.meetingLink,
          application: {
            id: event.application.id,
            position: event.application.position,
            company: { name: event.application.company.name },
          },
        };
      });
    }),

  getGoogleCalendarSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    const connection = await getGoogleCalendarConnectionForUser(ctx.user.id);
    if (!connection) {
      return { connected: false as const };
    }
    return {
      connected: true as const,
      status: connection.lastRefreshErrorAt
        ? ("refresh_error" as const)
        : ("connected" as const),
    };
  }),

  createCompany: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        website: z.string().url().optional().or(z.literal("")),
        linkedinUrl: z.string().url().optional().or(z.literal("")),
        location: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.create({
        data: {
          name: input.name,
          email: input.email === "" ? undefined : input.email,
          website: input.website === "" ? undefined : input.website,
          linkedinUrl: input.linkedinUrl === "" ? undefined : input.linkedinUrl,
          location: input.location ?? undefined,
          description: input.description ?? undefined,
          userId: ctx.user.id,
        },
      });
      return mapCompanyToEditorDto(company);
    }),

  updateCompany: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        website: z.string().url().optional().or(z.literal("")),
        linkedinUrl: z.string().url().optional().or(z.literal("")),
        location: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const company = await ctx.db.company.update({
        where: { id, userId: ctx.user.id },
        data: {
          name: data.name,
          email: data.email === "" ? undefined : data.email,
          website: data.website === "" ? undefined : data.website,
          linkedinUrl: data.linkedinUrl === "" ? undefined : data.linkedinUrl,
          location: data.location ?? undefined,
          description: data.description ?? undefined,
        },
      });
      return mapCompanyToEditorDto(company);
    }),

  deleteCompany: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.company.delete({
        where: { id: input.id, userId: ctx.user.id },
      });
    }),

  importFromUrl: protectedProcedure
    .input(
      z.object({
        url: z.string().trim().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await importJobFromUrl(input.url);
      } catch (error) {
        if (error instanceof ImportFromUrlError) {
          throw new TRPCError({
            code:
              error.code === "IMPORT_FETCH_FAILED"
                ? "BAD_GATEWAY"
                : "BAD_REQUEST",
            message: error.code,
          });
        }
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "IMPORT_FETCH_FAILED",
        });
      }
    }),

  createApplication: protectedProcedure
    .input(
      z.object({
        position: z.string().min(1),
        companyId: z.string(),
        status: ApplicationStatusSchema,
        appliedDate: z.date(),
        salary: z.string().optional(),
        location: z.string().optional(),
        jobUrl: z.string().url().optional().or(z.literal("")),
        notes: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.create({
        data: {
          ...input,
          jobUrl: input.jobUrl === "" ? undefined : input.jobUrl,
          userId: ctx.user.id,
        },
      });
      return mapApplicationToEditorDto(application);
    }),

  updateApplication: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        position: z.string().min(1).optional(),
        companyId: z.string().optional(),
        status: ApplicationStatusSchema.optional(),
        appliedDate: z.date().optional(),
        salary: z.string().optional(),
        location: z.string().optional(),
        jobUrl: z.string().url().optional().or(z.literal("")),
        notes: z.string().optional(),
        description: z.string().optional(),
        cvFile: cvFileSchema.optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, cvFile, ...data } = input;
      const application = await ctx.db.application.update({
        where: { id, userId: ctx.user.id },
        data: {
          ...data,
          jobUrl: data.jobUrl === "" ? undefined : data.jobUrl,
          cvFile: cvFile === null ? undefined : cvFile,
        },
      });
      return mapApplicationToEditorDto(application);
    }),

  updateApplicationStatuses: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(50),
        status: ApplicationStatusSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.application.updateMany({
        where: { id: { in: input.ids }, userId: ctx.user.id },
        data: {
          status: input.status,
          ...(input.status === "GHOSTED"
            ? { ghostNudgeSnoozedUntil: null }
            : {}),
        },
      });
      return { count: result.count };
    }),

  snoozeGhostNudge: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(50),
        days: z.number().int().min(1).max(90).default(7),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const snoozedUntil = ghostNudgeSnoozeUntil(input.days);
      const result = await ctx.db.application.updateMany({
        where: { id: { in: input.ids }, userId: ctx.user.id },
        data: { ghostNudgeSnoozedUntil: snoozedUntil },
      });
      return { count: result.count, snoozedUntil };
    }),

  deleteApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.application.delete({
        where: { id: input.id, userId: ctx.user.id },
      });
    }),

  updateApplicationStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: ApplicationStatusSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.update({
        where: { id: input.id, userId: ctx.user.id },
        data: {
          status: input.status,
          ...(input.status === "GHOSTED"
            ? { ghostNudgeSnoozedUntil: null }
            : {}),
        },
      });
      return mapApplicationToEditorDto(application);
    }),

  createEvent: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        type: EventTypeSchema,
        title: z.string().min(1),
        description: z.string().optional(),
        scheduledDate: z.date(),
        duration: z.number().optional(),
        location: z.string().optional(),
        isVirtual: z.boolean().optional(),
        meetingLink: z.string().url().optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.applicationEvent.create({
        data: {
          ...input,
          meetingLink: input.meetingLink === "" ? undefined : input.meetingLink,
          userId: ctx.user.id,
        },
        include: {
          application: { include: { company: true } },
        },
      });

      await pushApplicationEventToGoogleCalendar(ctx.user.id, {
        id: event.id,
        title: event.title,
        description: event.description,
        scheduledDate: event.scheduledDate,
        duration: event.duration,
        location: event.location,
        meetingLink: event.meetingLink,
        companyName: event.application.company.name,
        position: event.application.position,
        completed: event.completed,
      });

      return event;
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        completed: z.boolean().optional(),
        completedAt: z.date().optional(),
        outcome: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]).optional(),
        notes: z.string().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        scheduledDate: z.date().optional(),
        duration: z.number().int().positive().optional(),
        location: z.string().optional(),
        isVirtual: z.boolean().optional(),
        meetingLink: z.string().url().optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, meetingLink, ...rest } = input;
      const data = {
        ...rest,
        ...(meetingLink !== undefined
          ? { meetingLink: meetingLink === "" ? null : meetingLink }
          : {}),
      };

      const event = await ctx.db.applicationEvent.update({
        where: { id, userId: ctx.user.id },
        data,
        include: {
          application: { include: { company: true } },
        },
      });

      const agendaChanged =
        input.title !== undefined ||
        input.description !== undefined ||
        input.scheduledDate !== undefined ||
        input.duration !== undefined ||
        input.location !== undefined ||
        input.isVirtual !== undefined ||
        input.meetingLink !== undefined;

      if (agendaChanged && event.googleEventId) {
        await updateApplicationEventOnGoogleCalendar(ctx.user.id, {
          id: event.id,
          title: event.title,
          description: event.description,
          scheduledDate: event.scheduledDate,
          duration: event.duration,
          location: event.location,
          meetingLink: event.meetingLink,
          companyName: event.application.company.name,
          position: event.application.position,
          googleEventId: event.googleEventId,
        });
      }

      return event;
    }),

  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.applicationEvent.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        select: { id: true, googleEventId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      await deleteApplicationEventFromGoogleCalendar(
        ctx.user.id,
        existing.googleEventId,
      );

      return ctx.db.applicationEvent.delete({
        where: { id: input.id, userId: ctx.user.id },
      });
    }),

  draftApplicationEmail: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        provider: z.enum(["claude", "openai", "deepseek", "gemini"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, userId: ctx.user.id },
        include: { company: true },
      });
      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      const draftCv = await loadCvStructuredDraft(ctx.db, ctx.user.id, {
        locale: "es",
        fallbackLocale: "en",
      });
      const jobContext = await loadTailorJobContext(
        ctx.db,
        ctx.user.id,
        application.id,
        "es",
      );

      const contacts = draftCv?.contacts ?? [];
      const contactValue = (type: string) =>
        contacts.find((c) => c.type === type)?.value?.trim() ?? null;

      try {
        const fromCv = draftCv?.header.fullName?.trim();
        const credentials = await loadTenantAiCredentials(ctx.user.id);
        const { draft, provider } = await draftApplicationEmailWithAi(
          {
            position: application.position,
            companyName: application.company.name,
            companyEmail: application.company.email,
            companyDescription: application.company.description,
            location: application.location,
            salary: application.salary,
            notes: application.notes,
            jobDescription: application.description ?? "",
            candidate: {
              fullName: fromCv ?? ctx.user.name ?? "Candidato",
              degree: draftCv?.header.degree,
              summary: draftCv?.header.summary,
              email: contactValue("EMAIL"),
              phone: contactValue("PHONE"),
              linkedin: contactValue("LINKEDIN"),
              softSkills: jobContext?.softSkills,
            },
          },
          credentials,
          input.provider,
        );

        if (draft.applyToEmail && !application.company.email?.trim()) {
          await ctx.db.company.update({
            where: { id: application.companyId },
            data: { email: draft.applyToEmail },
          });
        }

        return {
          ...draft,
          provider,
          hasCvFile: Boolean(application.cvFile?.url),
          cvFileName: application.cvFile?.name ?? null,
          canSendEmail: (await getPortfolioEmailClient(ctx.user.id))
            .isConfigured,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: formatZodParseError(error),
        });
      }
    }),

  draftApplicationCoverLetter: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        provider: z.enum(["claude", "openai", "deepseek", "gemini"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, userId: ctx.user.id },
        include: { company: true },
      });
      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      const draftCv = await loadCvStructuredDraft(ctx.db, ctx.user.id, {
        locale: "es",
        fallbackLocale: "en",
      });
      const jobContext = await loadTailorJobContext(
        ctx.db,
        ctx.user.id,
        application.id,
        "es",
      );

      const contacts = draftCv?.contacts ?? [];
      const contactValue = (type: string) =>
        contacts.find((c) => c.type === type)?.value?.trim() ?? null;

      const highlights =
        draftCv?.experiences
          .flatMap((exp) => exp.responsibilities.slice(0, 2))
          .filter((text) => text.trim().length > 0)
          .slice(0, 6) ?? [];

      try {
        const fromCv = draftCv?.header.fullName?.trim();
        const credentials = await loadTenantAiCredentials(ctx.user.id);
        const { draft, provider } = await draftApplicationCoverLetterWithAi(
          {
            position: application.position,
            companyName: application.company.name,
            companyDescription: application.company.description,
            location: application.location,
            salary: application.salary,
            notes: application.notes,
            jobDescription: application.description ?? "",
            candidate: {
              fullName: fromCv ?? ctx.user.name ?? "Candidato",
              degree: draftCv?.header.degree,
              summary: draftCv?.header.summary,
              email: contactValue("EMAIL"),
              phone: contactValue("PHONE"),
              linkedin: contactValue("LINKEDIN"),
              softSkills: jobContext?.softSkills,
              highlights,
            },
          },
          credentials,
          input.provider,
        );

        const updated = await ctx.db.application.update({
          where: { id: application.id },
          data: {
            coverLetterSubject: draft.subject,
            coverLetterBody: draft.body,
          },
        });

        return {
          subject: updated.coverLetterSubject ?? draft.subject,
          body: updated.coverLetterBody ?? draft.body,
          notes: draft.notes ?? null,
          provider,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: formatZodParseError(error),
        });
      }
    }),

  getApplicationCoverLetterPrompt: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, userId: ctx.user.id },
        include: { company: true },
      });
      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      const draftCv = await loadCvStructuredDraft(ctx.db, ctx.user.id, {
        locale: "es",
        fallbackLocale: "en",
      });
      const jobContext = await loadTailorJobContext(
        ctx.db,
        ctx.user.id,
        application.id,
        "es",
      );

      const contacts = draftCv?.contacts ?? [];
      const contactValue = (type: string) =>
        contacts.find((c) => c.type === type)?.value?.trim() ?? null;

      const highlights =
        draftCv?.experiences
          .flatMap((exp) => exp.responsibilities.slice(0, 2))
          .filter((text) => text.trim().length > 0)
          .slice(0, 6) ?? [];

      const fromCv = draftCv?.header.fullName?.trim();
      return buildApplicationCoverLetterPromptPackage({
        position: application.position,
        companyName: application.company.name,
        companyDescription: application.company.description,
        location: application.location,
        salary: application.salary,
        notes: application.notes,
        jobDescription: application.description ?? "",
        candidate: {
          fullName: fromCv ?? ctx.user.name ?? "Candidato",
          degree: draftCv?.header.degree,
          summary: draftCv?.header.summary,
          email: contactValue("EMAIL"),
          phone: contactValue("PHONE"),
          linkedin: contactValue("LINKEDIN"),
          softSkills: jobContext?.softSkills,
          highlights,
        },
      });
    }),

  saveApplicationCoverLetter: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        subject: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(12000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, userId: ctx.user.id },
        select: { id: true },
      });
      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      const updated = await ctx.db.application.update({
        where: { id: application.id },
        data: {
          coverLetterSubject: input.subject,
          coverLetterBody: input.body,
        },
      });

      return {
        subject: updated.coverLetterSubject ?? input.subject,
        body: updated.coverLetterBody ?? input.body,
      };
    }),

  sendApplicationEmail: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        toEmail: z.string().trim().email().max(120),
        subject: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(8000),
        recipientName: z.string().trim().max(120).optional(),
        trackOpens: z.boolean().default(false),
        sendCopy: z.boolean().default(true),
        locale: z.enum(locales).default("en"),
        /** Optional override; when set, this file is attached instead of application.cvFile. */
        attachmentUrl: z.string().url().optional(),
        attachmentName: z.string().trim().min(1).max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.findFirst({
        where: { id: input.applicationId, userId: ctx.user.id },
        include: { company: true },
      });
      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      const overrideUrl = input.attachmentUrl?.trim();
      const attachmentUrl = overrideUrl ?? application.cvFile?.url;
      if (!attachmentUrl) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Attach a CV file or tailor one for this application before sending.",
        });
      }

      const emailClient = await getPortfolioEmailClient(ctx.user.id);
      if (
        !emailClient.isConfigured ||
        !emailClient.resend ||
        !emailClient.fromEmail
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Resend is not configured for this portfolio.",
        });
      }

      const draftCv = await loadCvStructuredDraft(ctx.db, ctx.user.id, {
        locale: "es",
        fallbackLocale: "en",
      });
      const candidateContactEmail = draftCv?.contacts.find(
        (c) => c.type === "EMAIL",
      )?.value;
      const replyTo = parseReplyToAddress(
        candidateContactEmail,
        draftCv?.header.fullName ?? ctx.user.name,
      );
      const rawCandidateEmail = candidateContactEmail ?? ctx.user.email;
      const copyRecipientEmail = rawCandidateEmail
        ? (parseReplyToAddress(rawCandidateEmail)
            ?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]
            ?.toLowerCase() ?? ctx.user.email?.toLowerCase())
        : ctx.user.email?.toLowerCase();

      const fileResponse = await fetch(attachmentUrl, {
        cache: "no-store",
      });
      if (!fileResponse.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not download the CV attachment.",
        });
      }
      const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
      const filename =
        input.attachmentName?.trim() ??
        application.cvFile?.name?.trim() ??
        `CV-${(draftCv?.header.fullName ?? "candidate").replace(/\s+/g, "-")}.docx`;

      const toEmail = input.toEmail.toLowerCase();
      const bodyText = input.body;
      const resendConfig = await getTenantIntegrationConfig(
        ctx.user.id,
        "resend",
      );

      const idempotencyKey = `app-cv-email/${application.id}/${createHash(
        "sha256",
      )
        .update(
          `${toEmail}|${input.subject}|${bodyText}|${attachmentUrl}|${input.trackOpens}|${input.locale}`,
        )
        .digest("hex")
        .slice(0, 24)}`;

      const trackingToken = input.trackOpens
        ? createEmailOpenTrackingToken(idempotencyKey)
        : null;
      const emailRecord = await ctx.db.applicationEmail.upsert({
        where: { idempotencyKey },
        create: {
          applicationId: application.id,
          userId: ctx.user.id,
          recipientEmail: toEmail,
          subject: input.subject,
          attachmentName: filename,
          trackingEnabled: input.trackOpens,
          trackingTokenHash: trackingToken
            ? hashEmailOpenTrackingToken(trackingToken)
            : undefined,
          idempotencyKey,
        },
        update: {},
      });
      const trackingPixelUrl =
        emailRecord.trackingEnabled && trackingToken
          ? `${getServerBaseUrl()}/api/job-tracker/email-open?token=${trackingToken}`
          : undefined;
      const bodyHtml = buildApplicationEmailHtml(
        bodyText,
        resendConfig?.emailSignatureHtml,
        trackingPixelUrl,
      );

      const { data, error } = await emailClient.resend.emails.send(
        {
          from: emailClient.fromEmail,
          to: toEmail,
          ...(replyTo ? { replyTo } : {}),
          subject: input.subject,
          text: bodyText,
          html: bodyHtml,
          attachments: [
            {
              filename,
              content: fileBuffer,
            },
          ],
        },
        { idempotencyKey },
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to send email",
        });
      }

      let copySent = false;
      if (
        input.sendCopy &&
        copyRecipientEmail &&
        copyRecipientEmail !== toEmail
      ) {
        const copyHtml = buildApplicationEmailHtml(
          bodyText,
          resendConfig?.emailSignatureHtml,
          undefined,
        );
        const copyIdempotencyKey = `copy/${idempotencyKey}`;
        try {
          await emailClient.resend.emails.send(
            {
              from: emailClient.fromEmail,
              to: copyRecipientEmail,
              ...(replyTo ? { replyTo } : {}),
              subject: input.subject,
              text: bodyText,
              html: copyHtml,
              attachments: [
                {
                  filename,
                  content: fileBuffer,
                },
              ],
            },
            { idempotencyKey: copyIdempotencyKey },
          );
          copySent = true;
        } catch (copyError) {
          console.error("Failed to send applicant copy email:", copyError);
        }
      }

      if (!emailRecord.sentAt) {
        await ctx.db.applicationEmail.update({
          where: { id: emailRecord.id },
          data: { sentAt: new Date() },
        });
      }

      await ctx.db.applicationEvent.create({
        data: {
          applicationId: application.id,
          userId: ctx.user.id,
          type: "FOLLOW_UP",
          title: `CV emailed to ${toEmail}`,
          description: input.recipientName
            ? `Sent CV to ${input.recipientName} <${toEmail}> (${filename})${copySent ? ` · Copy sent to ${copyRecipientEmail}` : ""}`
            : `Sent CV to ${toEmail} (${filename})${copySent ? ` · Copy sent to ${copyRecipientEmail}` : ""}`,
          scheduledDate: new Date(),
          completed: true,
          completedAt: new Date(),
          outcome: "NEUTRAL",
          notes: input.subject,
        },
      });

      if (!application.company.email?.trim()) {
        await ctx.db.company.update({
          where: { id: application.companyId },
          data: { email: toEmail },
        });
      }

      return { emailId: data?.id ?? null, copySent };
    }),

  getApplicationEmailHistory: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.applicationEmail.findMany({
        where: {
          applicationId: input.applicationId,
          userId: ctx.user.id,
          sentAt: { not: null },
        },
        select: {
          id: true,
          recipientEmail: true,
          subject: true,
          attachmentName: true,
          trackingEnabled: true,
          openCount: true,
          firstOpenedAt: true,
          lastOpenedAt: true,
          sentAt: true,
          opens: {
            select: {
              id: true,
              openedAt: true,
              userAgent: true,
              ipAddress: true,
            },
            orderBy: { openedAt: "desc" },
          },
        },
        orderBy: { sentAt: "desc" },
      });
    }),

  getApplicationEmailCapabilities: protectedProcedure.query(async ({ ctx }) => {
    const emailClient = await getPortfolioEmailClient(ctx.user.id);
    const credentials = await loadTenantAiCredentials(ctx.user.id);
    const providers = getAvailableAiProviders(credentials);
    const defaultProvider = getDefaultAiProvider(credentials);
    return {
      canSendEmail: emailClient.isConfigured,
      hasAiProvider: providers.length > 0,
      defaultProvider,
      providers,
    };
  }),

  getEmailTrackingHub: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [sentEmails, recentOpens24h] = await Promise.all([
      ctx.db.applicationEmail.findMany({
        where: {
          userId,
          sentAt: { not: null },
        },
        select: {
          id: true,
          applicationId: true,
          recipientEmail: true,
          subject: true,
          attachmentName: true,
          trackingEnabled: true,
          openCount: true,
          firstOpenedAt: true,
          lastOpenedAt: true,
          sentAt: true,
          application: {
            select: {
              id: true,
              position: true,
              status: true,
              appliedDate: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },
          },
          opens: {
            select: {
              id: true,
              openedAt: true,
              userAgent: true,
              ipAddress: true,
            },
            orderBy: { openedAt: "desc" },
            take: 10,
          },
        },
        orderBy: { sentAt: "desc" },
      }),
      ctx.db.applicationEmailOpen.count({
        where: {
          email: { userId },
          openedAt: { gte: since24h },
        },
      }),
    ]);

    const totalSent = sentEmails.length;
    const trackedEmails = sentEmails.filter((e) => e.trackingEnabled);
    const totalTracked = trackedEmails.length;
    const openedTracked = trackedEmails.filter((e) => e.openCount > 0).length;
    const totalOpens = sentEmails.reduce(
      (acc, e) => acc + (e.openCount || 0),
      0,
    );
    const openRate =
      totalTracked > 0 ? Math.round((openedTracked / totalTracked) * 100) : 0;

    type SentEmailItem = (typeof sentEmails)[number];
    interface GroupedApplication {
      applicationId: string;
      position: string;
      status: string;
      appliedDate: Date;
      company: {
        id: string;
        name: string;
        location: string | null;
      };
      totalEmails: number;
      totalOpens: number;
      lastOpenedAt: Date | null;
      lastSentAt: Date;
      emails: SentEmailItem[];
    }

    const appMap = new Map<string, GroupedApplication>();

    for (const email of sentEmails) {
      if (!email.application) continue;
      const appId = email.applicationId;
      const existing = appMap.get(appId);
      const emailSentAt = email.sentAt ?? new Date();

      if (!existing) {
        appMap.set(appId, {
          applicationId: appId,
          position: email.application.position,
          status: email.application.status,
          appliedDate: email.application.appliedDate,
          company: {
            id: email.application.company.id,
            name: email.application.company.name,
            location: email.application.company.location,
          },
          totalEmails: 1,
          totalOpens: email.openCount || 0,
          lastOpenedAt: email.lastOpenedAt,
          lastSentAt: emailSentAt,
          emails: [email],
        });
      } else {
        existing.totalEmails += 1;
        existing.totalOpens += email.openCount || 0;
        existing.emails.push(email);
        if (emailSentAt > existing.lastSentAt) {
          existing.lastSentAt = emailSentAt;
        }
        if (
          email.lastOpenedAt &&
          (!existing.lastOpenedAt || email.lastOpenedAt > existing.lastOpenedAt)
        ) {
          existing.lastOpenedAt = email.lastOpenedAt;
        }
      }
    }

    const applications = Array.from(appMap.values()).sort((a, b) => {
      if (a.lastOpenedAt && b.lastOpenedAt) {
        return b.lastOpenedAt.getTime() - a.lastOpenedAt.getTime();
      }
      if (a.lastOpenedAt) return -1;
      if (b.lastOpenedAt) return 1;
      return b.lastSentAt.getTime() - a.lastSentAt.getTime();
    });

    return {
      stats: {
        totalSent,
        totalTracked,
        totalOpens,
        openRate,
        recentOpens24h,
      },
      applications,
    };
  }),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildApplicationEmailHtml(
  bodyText: string,
  signatureHtml?: string | null,
  trackingPixelUrl?: string,
): string {
  const paragraphs = bodyText
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />"),
    )
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 0.75rem 0; font-family:Arial,sans-serif; font-size:0.875rem; color:#111;">${paragraph}</p>`,
    )
    .join("");

  const signature = signatureHtml?.trim();
  const pixel = trackingPixelUrl
    ? `<img src="${escapeHtml(trackingPixelUrl)}" width="1" height="1" border="0" alt="" style="display:none !important;width:1px !important;height:1px !important;max-height:0 !important;max-width:0 !important;opacity:0 !important;overflow:hidden !important;mso-hide:all;" />`
    : "";
  if (!signature) return `${paragraphs}${pixel}`;

  return `${paragraphs}<div style="margin-top:1.75rem;">${signature}</div>${pixel}`;
}

/** Resend accepts `email@x.com` or `Name <email@x.com>` only. */
function parseReplyToAddress(
  raw: string | null | undefined,
  displayName?: string | null,
): string | undefined {
  if (!raw?.trim()) return undefined;

  const trimmed = raw.trim().replace(/^mailto:/i, "");
  const angleMatch = /<([^>]+)>/.exec(trimmed);
  const candidate = (angleMatch?.[1] ?? trimmed).trim();
  const emailMatch = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.exec(
    candidate,
  );
  if (!emailMatch) return undefined;

  const email = emailMatch[0].toLowerCase();
  const name = displayName?.trim().replace(/[<>]/g, "");
  if (name) return `${name} <${email}>`;
  return email;
}
