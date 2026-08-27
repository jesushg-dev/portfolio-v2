import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { assertNonEmptyUserId } from "@/lib/admin/get-authenticated-user-id";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import { extractStringFilter } from "@/lib/admin/filter-utils";
import {
  mapApplicationToDetailDto,
  mapApplicationToEditorDto,
  mapApplicationsToListDto,
  type ApplicationStatus,
} from "@/features/job-tracker/lib/application-editor-dto";
import {
  mapCompaniesToEditorDto,
  mapCompanyToEditorDto,
} from "@/features/job-tracker/lib/company-editor-dto";

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
          include: { company: true },
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
      inProgress: countByStatus("INTERVIEW"),
      offers: countByStatus("OFFER"),
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

      return events.map((event) => ({
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        scheduledDate: event.scheduledDate,
        duration: event.duration,
        location: event.location,
        isVirtual: event.isVirtual,
        meetingLink: event.meetingLink,
        application: {
          id: event.application.id,
          position: event.application.position,
          company: { name: event.application.company.name },
        },
      }));
    }),

  createCompany: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        website: z.string().url().optional().or(z.literal("")),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.create({
        data: {
          name: input.name,
          email: input.email === "" ? undefined : input.email,
          website: input.website === "" ? undefined : input.website,
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

  createApplication: protectedProcedure
    .input(
      z.object({
        position: z.string().min(1),
        companyId: z.string(),
        status: ApplicationStatusSchema,
        appliedDate: z.date(),
        salary: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.create({
        data: {
          ...input,
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
          cvFile: cvFile === null ? undefined : cvFile,
        },
      });
      return mapApplicationToEditorDto(application);
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
        data: { status: input.status },
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
      return ctx.db.applicationEvent.create({
        data: {
          ...input,
          meetingLink: input.meetingLink === "" ? undefined : input.meetingLink,
          userId: ctx.user.id,
        },
      });
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        completed: z.boolean().optional(),
        completedAt: z.date().optional(),
        outcome: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]).optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.applicationEvent.update({
        where: { id, userId: ctx.user.id },
        data,
      });
    }),

  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.applicationEvent.delete({
        where: { id: input.id, userId: ctx.user.id },
      });
    }),
});
