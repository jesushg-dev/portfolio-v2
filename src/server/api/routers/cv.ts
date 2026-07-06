import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";
import { type db } from "@/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { LocalizedTextSchema } from "@/lib/i18n/localized";

const CvContactType = z.enum([
  "EMAIL",
  "PHONE",
  "LINKEDIN",
  "GITHUB",
  "WEBSITE",
  "LOCATION",
  "OTHER",
]);

const CvSkillCategory = z.enum([
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "TOOLS",
  "MOBILE",
  "DESKTOP",
  "DEVOPS",
  "CYBERSECURITY",
  "OTHER",
]);

/**
 * Returns every CV section for a given userId. Used by the public CV page
 * (server-side) and by the dashboard to hydrate forms.
 */
const getFullCvForUser = async (ctx: { db: typeof db }, userId: string) => {
  const [
    profile,
    header,
    aboutMe,
    contacts,
    educations,
    languages,
    technicalSkills,
    experiences,
    softSkills,
    additionalInformation,
    personalReferences,
  ] = await Promise.all([
    ctx.db.profile.findUnique({ where: { userId } }),
    ctx.db.cvHeader.findUnique({ where: { userId } }),
    ctx.db.cvAboutMe.findUnique({ where: { userId } }),
    ctx.db.cvContact.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvEducation.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvLanguage.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvTechnicalSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvExperience.findMany({
      where: { userId },
      include: { responsibilities: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvSoftSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvAdditionalInfo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvPersonalReference.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
  ]);

  return {
    profile,
    header,
    aboutMe,
    contacts,
    educations,
    languages,
    technicalSkills,
    experiences,
    softSkills,
    additionalInformation,
    personalReferences,
  };
};

export const cvRouter = createTRPCRouter({
  /**
   * Public — fetches the full CV for the current tenant (resolved from host).
   * Used by the public CV page renderer.
   */
  getPublic: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.tenant) return null;
    return getFullCvForUser(ctx, ctx.tenant.userId);
  }),

  /**
   * Authenticated — fetches the CV of the currently logged-in user.
   */
  getMine: protectedProcedure.query(async ({ ctx }) => {
    return getFullCvForUser(ctx, ctx.user.id);
  }),

  // ---------- Header ----------
  upsertHeader: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        degree: LocalizedTextSchema,
        photoUrl: z.string().url().nullable().optional(),
        clientImageAlt: LocalizedTextSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cvHeader.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          fullName: input.fullName,
          degree: input.degree as Prisma.InputJsonValue,
          photoUrl: input.photoUrl ?? null,
          clientImageAlt: (input.clientImageAlt ?? undefined) as
            Prisma.InputJsonValue | undefined,
        },
        update: {
          fullName: input.fullName,
          degree: input.degree as Prisma.InputJsonValue,
          photoUrl: input.photoUrl ?? null,
          clientImageAlt: (input.clientImageAlt ?? undefined) as
            Prisma.InputJsonValue | undefined,
        },
      });
    }),

  // ---------- About me ----------
  upsertAboutMe: protectedProcedure
    .input(z.object({ aboutMe: LocalizedTextSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cvAboutMe.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          aboutMe: input.aboutMe as Prisma.InputJsonValue,
        },
        update: { aboutMe: input.aboutMe as Prisma.InputJsonValue },
      });
    }),

  // ---------- Contacts ----------
  createContact: protectedProcedure
    .input(
      z.object({
        type: CvContactType,
        value: z.string().min(1),
        label: LocalizedTextSchema.optional(),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { label, ...rest } = input;
      return ctx.db.cvContact.create({
        data: {
          ...rest,
          label: (label ?? undefined) as Prisma.InputJsonValue | undefined,
          userId: ctx.user.id,
        },
      });
    }),
  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: CvContactType,
        value: z.string().min(1),
        label: LocalizedTextSchema.optional(),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, label, ...data } = input;
      const existing = await ctx.db.cvContact.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvContact.update({
        where: { id },
        data: {
          ...data,
          label: (label ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
    }),
  deleteContact: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvContact.findUnique({
        where: { id: input.id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvContact.delete({ where: { id: input.id } });
    }),

  // ---------- Education ----------
  createEducation: protectedProcedure
    .input(
      z.object({
        institution: z.string().min(1),
        degreeName: LocalizedTextSchema,
        location: LocalizedTextSchema.optional(),
        description: LocalizedTextSchema.optional(),
        startYear: z.number().int().optional(),
        endYear: z.number().int().optional(),
        dates: z.string().optional(),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { degreeName, location, description, ...rest } = input;
      return ctx.db.cvEducation.create({
        data: {
          ...rest,
          degreeName: degreeName as Prisma.InputJsonValue,
          location: (location ?? undefined) as
            Prisma.InputJsonValue | undefined,
          description: (description ?? undefined) as
            Prisma.InputJsonValue | undefined,
          userId: ctx.user.id,
        },
      });
    }),
  updateEducation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        institution: z.string().min(1),
        degreeName: LocalizedTextSchema,
        location: LocalizedTextSchema.optional(),
        description: LocalizedTextSchema.optional(),
        startYear: z.number().int().optional(),
        endYear: z.number().int().optional(),
        dates: z.string().optional(),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, degreeName, location, description, ...data } = input;
      const existing = await ctx.db.cvEducation.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvEducation.update({
        where: { id },
        data: {
          ...data,
          degreeName: degreeName as Prisma.InputJsonValue,
          location: (location ?? undefined) as
            Prisma.InputJsonValue | undefined,
          description: (description ?? undefined) as
            Prisma.InputJsonValue | undefined,
        },
      });
    }),
  deleteEducation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvEducation.findUnique({
        where: { id: input.id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvEducation.delete({ where: { id: input.id } });
    }),

  // ---------- Languages ----------
  createLanguage: protectedProcedure
    .input(
      z.object({
        name: LocalizedTextSchema,
        level: LocalizedTextSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, level, ...rest } = input;
      return ctx.db.cvLanguage.create({
        data: {
          ...rest,
          name: name as Prisma.InputJsonValue,
          level: level as Prisma.InputJsonValue,
          userId: ctx.user.id,
        },
      });
    }),
  updateLanguage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: LocalizedTextSchema,
        level: LocalizedTextSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, level, ...data } = input;
      const existing = await ctx.db.cvLanguage.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvLanguage.update({
        where: { id },
        data: {
          ...data,
          name: name as Prisma.InputJsonValue,
          level: level as Prisma.InputJsonValue,
        },
      });
    }),
  deleteLanguage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvLanguage.findUnique({
        where: { id: input.id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvLanguage.delete({ where: { id: input.id } });
    }),

  // ---------- Technical Skills ----------
  createTechnicalSkill: protectedProcedure
    .input(
      z.object({
        category: CvSkillCategory,
        items: z.array(z.string().min(1)).min(1),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cvTechnicalSkill.create({
        data: { ...input, userId: ctx.user.id },
      });
    }),
  updateTechnicalSkill: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        category: CvSkillCategory,
        items: z.array(z.string().min(1)).min(1),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.db.cvTechnicalSkill.findUnique({
        where: { id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvTechnicalSkill.update({ where: { id }, data });
    }),
  deleteTechnicalSkill: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvTechnicalSkill.findUnique({
        where: { id: input.id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvTechnicalSkill.delete({ where: { id: input.id } });
    }),

  // ---------- Experiences ----------
  createExperience: protectedProcedure
    .input(
      z.object({
        company: z.string().min(1),
        role: LocalizedTextSchema,
        location: LocalizedTextSchema.optional(),
        dates: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        current: z.boolean().default(false),
        skills: z.string().optional(),
        order: z.number().int().nonnegative().default(0),
        responsibilities: z
          .array(
            z.object({
              text: LocalizedTextSchema,
              order: z.number().int().nonnegative().default(0),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { responsibilities, role, location, ...rest } = input;
      return ctx.db.cvExperience.create({
        data: {
          ...rest,
          role: role as Prisma.InputJsonValue,
          location: (location ?? undefined) as
            Prisma.InputJsonValue | undefined,
          userId: ctx.user.id,
          responsibilities: responsibilities.length
            ? {
                createMany: {
                  data: responsibilities.map((r) => ({
                    ...r,
                    text: r.text as Prisma.InputJsonValue,
                  })),
                },
              }
            : undefined,
        },
        include: { responsibilities: true },
      });
    }),
  updateExperience: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        company: z.string().min(1),
        role: LocalizedTextSchema,
        location: LocalizedTextSchema.optional(),
        dates: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        current: z.boolean().default(false),
        skills: z.string().optional(),
        order: z.number().int().nonnegative().default(0),
        responsibilities: z
          .array(
            z.object({
              text: LocalizedTextSchema,
              order: z.number().int().nonnegative().default(0),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, responsibilities, role, location, ...data } = input;
      const existing = await ctx.db.cvExperience.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      // Replace responsibilities atomically (within MongoDB constraints).
      await ctx.db.cvResponsibility.deleteMany({
        where: { experienceId: id },
      });
      return ctx.db.cvExperience.update({
        where: { id },
        data: {
          ...data,
          role: role as Prisma.InputJsonValue,
          location: (location ?? undefined) as
            Prisma.InputJsonValue | undefined,
          responsibilities: responsibilities.length
            ? {
                createMany: {
                  data: responsibilities.map((r) => ({
                    ...r,
                    text: r.text as Prisma.InputJsonValue,
                  })),
                },
              }
            : undefined,
        },
        include: { responsibilities: true },
      });
    }),
  deleteExperience: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvExperience.findUnique({
        where: { id: input.id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.cvResponsibility.deleteMany({
        where: { experienceId: input.id },
      });
      return ctx.db.cvExperience.delete({ where: { id: input.id } });
    }),

  // ---------- Soft skills ----------
  createSoftSkill: protectedProcedure
    .input(
      z.object({
        name: LocalizedTextSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, ...rest } = input;
      return ctx.db.cvSoftSkill.create({
        data: {
          ...rest,
          name: name as Prisma.InputJsonValue,
          userId: ctx.user.id,
        },
      });
    }),
  updateSoftSkill: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: LocalizedTextSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, ...rest } = input;
      const existing = await ctx.db.cvSoftSkill.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvSoftSkill.update({
        where: { id },
        data: { ...rest, name: name as Prisma.InputJsonValue },
      });
    }),
  deleteSoftSkill: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvSoftSkill.findUnique({
        where: { id: input.id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvSoftSkill.delete({ where: { id: input.id } });
    }),

  // ---------- Additional info ----------
  createAdditionalInfo: protectedProcedure
    .input(
      z.object({
        text: LocalizedTextSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { text, ...rest } = input;
      return ctx.db.cvAdditionalInfo.create({
        data: {
          ...rest,
          text: text as Prisma.InputJsonValue,
          userId: ctx.user.id,
        },
      });
    }),
  updateAdditionalInfo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        text: LocalizedTextSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, text, ...rest } = input;
      const existing = await ctx.db.cvAdditionalInfo.findUnique({
        where: { id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvAdditionalInfo.update({
        where: { id },
        data: { ...rest, text: text as Prisma.InputJsonValue },
      });
    }),
  deleteAdditionalInfo: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvAdditionalInfo.findUnique({
        where: { id: input.id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvAdditionalInfo.delete({ where: { id: input.id } });
    }),

  // ---------- Profile / settings ----------
  upsertProfile: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(40)
          .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
        displayName: z.string().min(1).optional(),
        defaultLocale: z.enum(["en", "es", "nl"]),
        isPublished: z.boolean().default(false),
        cvPdfUrl: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure username uniqueness across other users
      const existing = await ctx.db.profile.findUnique({
        where: { username: input.username },
      });
      if (existing && existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username is already taken",
        });
      }
      return ctx.db.profile.upsert({
        where: { userId: ctx.user.id },
        create: { ...input, userId: ctx.user.id },
        update: input,
      });
    }),

  // ---------- PDF Links (per-locale CV download URLs) ----------

  /** Returns all PDF links for the currently authenticated user. */
  getPdfLinks: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.cvPdfLink.findMany({
      where: { userId: ctx.user.id },
      orderBy: { locale: "asc" },
    });
  }),

  /**
   * Creates or updates the PDF link for a given locale.
   * Uses the unique(userId, locale) constraint for upsert.
   */
  upsertPdfLink: protectedProcedure
    .input(
      z.object({
        locale: z.string().min(2).max(10),
        url: z.string().url("Must be a valid URL"),
        label: z.string().max(80).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cvPdfLink.upsert({
        where: { userId_locale: { userId: ctx.user.id, locale: input.locale } },
        create: { userId: ctx.user.id, ...input },
        update: { url: input.url, label: input.label },
      });
    }),

  /** Removes the PDF link for a given locale. Silently succeeds if not found. */
  deletePdfLink: protectedProcedure
    .input(z.object({ locale: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvPdfLink.findUnique({
        where: { userId_locale: { userId: ctx.user.id, locale: input.locale } },
      });
      if (!existing) return null;
      return ctx.db.cvPdfLink.delete({
        where: { userId_locale: { userId: ctx.user.id, locale: input.locale } },
      });
    }),

  // ---------- Bulk Reordering ----------
  reorderExperiences: protectedProcedure
    .input(
      z.array(
        z.object({ id: z.string(), order: z.number().int().nonnegative() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.cvExperience.update({
            where: { id: item.id, userId: ctx.user.id },
            data: { order: item.order },
          }),
        ),
      );
    }),
  reorderEducations: protectedProcedure
    .input(
      z.array(
        z.object({ id: z.string(), order: z.number().int().nonnegative() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.cvEducation.update({
            where: { id: item.id, userId: ctx.user.id },
            data: { order: item.order },
          }),
        ),
      );
    }),
  reorderLanguages: protectedProcedure
    .input(
      z.array(
        z.object({ id: z.string(), order: z.number().int().nonnegative() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.cvLanguage.update({
            where: { id: item.id, userId: ctx.user.id },
            data: { order: item.order },
          }),
        ),
      );
    }),
  reorderTechnicalSkills: protectedProcedure
    .input(
      z.array(
        z.object({ id: z.string(), order: z.number().int().nonnegative() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.cvTechnicalSkill.update({
            where: { id: item.id, userId: ctx.user.id },
            data: { order: item.order },
          }),
        ),
      );
    }),
  reorderSoftSkills: protectedProcedure
    .input(
      z.array(
        z.object({ id: z.string(), order: z.number().int().nonnegative() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.cvSoftSkill.update({
            where: { id: item.id, userId: ctx.user.id },
            data: { order: item.order },
          }),
        ),
      );
    }),
  reorderContacts: protectedProcedure
    .input(
      z.array(
        z.object({ id: z.string(), order: z.number().int().nonnegative() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.cvContact.update({
            where: { id: item.id, userId: ctx.user.id },
            data: { order: item.order },
          }),
        ),
      );
    }),
  reorderAdditionalInfo: protectedProcedure
    .input(
      z.array(
        z.object({ id: z.string(), order: z.number().int().nonnegative() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.cvAdditionalInfo.update({
            where: { id: item.id, userId: ctx.user.id },
            data: { order: item.order },
          }),
        ),
      );
    }),
});
