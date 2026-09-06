import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { AppLanguage, PrismaClient } from "@prisma/client";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TextTranslationMapSchema } from "@/lib/i18n/localized-form";
import type { TextTranslationMap } from "@/lib/i18n/translation-map";
import { resolveCvPdfAsset } from "@/features/cv/lib/resolve-cv-pdf-asset";
import { normalizeEmploymentDates } from "@/utils/tools/date";
import { geocodePlace } from "@/lib/geo/geocode-place";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";

type CvDbClient = Pick<PrismaClient, "appLanguage">;

async function getAppLanguages(db: CvDbClient): Promise<AppLanguage[]> {
  return db.appLanguage.findMany({ orderBy: { code: "asc" } });
}

async function upsertEducationTranslations(
  db: PrismaClient,
  languages: AppLanguage[],
  educationId: string,
  degreeName: TextTranslationMap,
  location?: TextTranslationMap,
  description?: TextTranslationMap,
) {
  for (const lang of languages) {
    const data = {
      degreeName: degreeName[lang.id]?.text ?? "",
      location: location?.[lang.id]?.text ?? null,
      description: description?.[lang.id]?.text ?? null,
    };
    const existing = await db.cvEducationTranslation.findFirst({
      where: { cvEducationId: educationId, appLanguageId: lang.id },
    });

    if (existing) {
      await db.cvEducationTranslation.update({
        where: { id: existing.id },
        data,
      });
      continue;
    }

    await db.cvEducationTranslation.create({
      data: {
        cvEducationId: educationId,
        appLanguageId: lang.id,
        ...data,
      },
    });
  }
}

async function upsertLanguageTranslations(
  db: PrismaClient,
  languages: AppLanguage[],
  languageId: string,
  name: TextTranslationMap,
  level: TextTranslationMap,
) {
  for (const lang of languages) {
    const data = {
      name: name[lang.id]?.text ?? "",
      level: level[lang.id]?.text ?? "",
    };
    const existing = await db.cvLanguageTranslation.findFirst({
      where: { cvLanguageId: languageId, appLanguageId: lang.id },
    });

    if (existing) {
      await db.cvLanguageTranslation.update({
        where: { id: existing.id },
        data,
      });
      continue;
    }

    await db.cvLanguageTranslation.create({
      data: {
        cvLanguageId: languageId,
        appLanguageId: lang.id,
        ...data,
      },
    });
  }
}

async function upsertExperienceTranslations(
  db: PrismaClient,
  languages: AppLanguage[],
  experienceId: string,
  role: TextTranslationMap,
  location?: TextTranslationMap,
  companyBlurb?: TextTranslationMap,
) {
  for (const lang of languages) {
    const data = {
      role: role[lang.id]?.text ?? "",
      location: location?.[lang.id]?.text ?? null,
      companyBlurb: companyBlurb?.[lang.id]?.text?.trim()
        ? companyBlurb[lang.id].text
        : null,
    };
    const existing = await db.cvExperienceTranslation.findFirst({
      where: { cvExperienceId: experienceId, appLanguageId: lang.id },
    });

    if (existing) {
      await db.cvExperienceTranslation.update({
        where: { id: existing.id },
        data,
      });
      continue;
    }

    await db.cvExperienceTranslation.create({
      data: {
        cvExperienceId: experienceId,
        appLanguageId: lang.id,
        ...data,
      },
    });
  }
}

function buildEducationTranslationCreates(
  languages: AppLanguage[],
  degreeName: TextTranslationMap,
  location?: TextTranslationMap,
  description?: TextTranslationMap,
) {
  return languages.map((lang) => ({
    appLanguageId: lang.id,
    degreeName: degreeName[lang.id]?.text ?? "",
    location: location?.[lang.id]?.text ?? null,
    description: description?.[lang.id]?.text ?? null,
  }));
}

function buildLanguageTranslationCreates(
  languages: AppLanguage[],
  name: TextTranslationMap,
  level: TextTranslationMap,
) {
  return languages.map((lang) => ({
    appLanguageId: lang.id,
    name: name[lang.id]?.text ?? "",
    level: level[lang.id]?.text ?? "",
  }));
}

function buildExperienceTranslationCreates(
  languages: AppLanguage[],
  role: TextTranslationMap,
  location?: TextTranslationMap,
  companyBlurb?: TextTranslationMap,
) {
  return languages.map((lang) => ({
    appLanguageId: lang.id,
    role: role[lang.id]?.text ?? "",
    location: location?.[lang.id]?.text ?? null,
    companyBlurb: companyBlurb?.[lang.id]?.text?.trim()
      ? companyBlurb[lang.id].text
      : null,
  }));
}

function buildResponsibilityTranslationCreates(
  languages: AppLanguage[],
  text: TextTranslationMap,
) {
  return languages.map((lang) => ({
    appLanguageId: lang.id,
    text: text[lang.id]?.text ?? "",
  }));
}

const CvTextTranslationMapSchema = TextTranslationMapSchema;

const CvContactType = z.enum([
  "EMAIL",
  "PHONE",
  "LINKEDIN",
  "GITHUB",
  "WEBSITE",
  "LOCATION",
  "CALENDLY",
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
const getFullCvForUser = async (ctx: { db: PrismaClient }, userId: string) => {
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
    ctx.db.cvHeader.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    ctx.db.cvAboutMe.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    ctx.db.cvContact.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvEducation.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvLanguage.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvTechnicalSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvExperience.findMany({
      where: { userId },
      include: {
        translations: true,
        responsibilities: {
          include: { translations: true },
          orderBy: { order: "asc" },
        },
        CvExperienceSkill: { include: { skill: true } },
      },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvSoftSkill.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvAdditionalInfo.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    ctx.db.cvPersonalReference.findMany({
      where: { userId },
      include: { translations: true },
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
    if (!ctx.tenant || !isPublicCvVisible(ctx.tenant)) return null;
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
        degree: CvTextTranslationMapSchema.optional(),
        photoUrl: z.string().nullable().optional(),
        backgroundImageUrl: z.string().nullable().optional(),
        heroSummary: CvTextTranslationMapSchema.optional(),
        clientImageAlt: CvTextTranslationMapSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const languages = await ctx.db.appLanguage.findMany();
      const header = await ctx.db.cvHeader.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          fullName: input.fullName,
          photoUrl: input.photoUrl ?? null,
          backgroundImageUrl: input.backgroundImageUrl ?? null,
        },
        update: {
          fullName: input.fullName,
          photoUrl: input.photoUrl ?? null,
          ...(input.backgroundImageUrl !== undefined
            ? { backgroundImageUrl: input.backgroundImageUrl }
            : {}),
        },
      });

      for (const lang of languages) {
        const degreeText = input.degree
          ? (input.degree[lang.id]?.text ?? "")
          : "";
        const summaryText = input.heroSummary
          ? (input.heroSummary[lang.id]?.text ?? null)
          : null;
        const altText = input.clientImageAlt
          ? (input.clientImageAlt[lang.id]?.text ?? null)
          : null;

        const existing = await ctx.db.cvHeaderTranslation.findFirst({
          where: { cvHeaderId: header.id, appLanguageId: lang.id },
        });

        if (existing) {
          await ctx.db.cvHeaderTranslation.update({
            where: { id: existing.id },
            data: {
              ...(degreeText ? { degree: degreeText } : {}),
              ...(summaryText !== null ? { heroSummary: summaryText } : {}),
              ...(altText !== null ? { clientImageAlt: altText } : {}),
            },
          });
        } else {
          await ctx.db.cvHeaderTranslation.create({
            data: {
              cvHeaderId: header.id,
              appLanguageId: lang.id,
              degree: degreeText,
              heroSummary: summaryText,
              clientImageAlt: altText,
            },
          });
        }
      }

      return header;
    }),

  // ---------- About me ----------
  upsertAboutMe: protectedProcedure
    .input(z.object({ aboutMe: CvTextTranslationMapSchema }))
    .mutation(async ({ ctx, input }) => {
      const languages = await ctx.db.appLanguage.findMany();
      const about = await ctx.db.cvAboutMe.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id },
        update: {},
      });

      for (const lang of languages) {
        const aboutMeText = input.aboutMe[lang.id]?.text ?? "";
        const existing = await ctx.db.cvAboutMeTranslation.findFirst({
          where: { cvAboutMeId: about.id, appLanguageId: lang.id },
        });

        if (existing) {
          await ctx.db.cvAboutMeTranslation.update({
            where: { id: existing.id },
            data: { aboutMe: aboutMeText },
          });
        } else {
          await ctx.db.cvAboutMeTranslation.create({
            data: {
              cvAboutMeId: about.id,
              appLanguageId: lang.id,
              aboutMe: aboutMeText,
            },
          });
        }
      }

      return about;
    }),

  // ---------- Contacts ----------
  createContact: protectedProcedure
    .input(
      z.object({
        type: CvContactType,
        value: z.string().min(1),
        label: CvTextTranslationMapSchema.optional(),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { label, ...rest } = input;
      const languages = await getAppLanguages(ctx.db);
      const contact = await ctx.db.cvContact.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          translations: label
            ? {
                create: languages.map((lang) => ({
                  appLanguageId: lang.id,
                  label: label[lang.id]?.text ?? "",
                })),
              }
            : undefined,
        },
        include: { translations: true },
      });
      return contact;
    }),
  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: CvContactType,
        value: z.string().min(1),
        label: CvTextTranslationMapSchema.optional(),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, label, ...data } = input;
      const existing = await ctx.db.cvContact.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const languages = await getAppLanguages(ctx.db);
      await ctx.db.cvContact.update({ where: { id }, data });

      if (label) {
        for (const lang of languages) {
          const labelText = label[lang.id]?.text ?? "";
          const existing = await ctx.db.cvContactTranslation.findFirst({
            where: { cvContactId: id, appLanguageId: lang.id },
          });

          if (existing) {
            await ctx.db.cvContactTranslation.update({
              where: { id: existing.id },
              data: { label: labelText },
            });
          } else {
            await ctx.db.cvContactTranslation.create({
              data: {
                cvContactId: id,
                appLanguageId: lang.id,
                label: labelText,
              },
            });
          }
        }
      }

      return ctx.db.cvContact.findUniqueOrThrow({
        where: { id },
        include: { translations: true },
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
        degreeName: CvTextTranslationMapSchema,
        location: CvTextTranslationMapSchema.optional(),
        description: CvTextTranslationMapSchema.optional(),
        startYear: z.number().int().optional(),
        endYear: z.number().int().optional(),
        dates: z.string().optional(),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { degreeName, location, description, ...rest } = input;
      const languages = await getAppLanguages(ctx.db);

      return ctx.db.cvEducation.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          translations: {
            create: buildEducationTranslationCreates(
              languages,
              degreeName,
              location,
              description,
            ),
          },
        },
        include: { translations: true },
      });
    }),
  updateEducation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        institution: z.string().min(1),
        degreeName: CvTextTranslationMapSchema,
        location: CvTextTranslationMapSchema.optional(),
        description: CvTextTranslationMapSchema.optional(),
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

      const languages = await getAppLanguages(ctx.db);
      await ctx.db.cvEducation.update({ where: { id }, data });
      await upsertEducationTranslations(
        ctx.db,
        languages,
        id,
        degreeName,
        location,
        description,
      );

      return ctx.db.cvEducation.findUniqueOrThrow({
        where: { id },
        include: { translations: true },
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
        name: CvTextTranslationMapSchema,
        level: CvTextTranslationMapSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, level, ...rest } = input;
      const languages = await getAppLanguages(ctx.db);

      return ctx.db.cvLanguage.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          translations: {
            create: buildLanguageTranslationCreates(languages, name, level),
          },
        },
        include: { translations: true },
      });
    }),
  updateLanguage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: CvTextTranslationMapSchema,
        level: CvTextTranslationMapSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, level, ...data } = input;
      const existing = await ctx.db.cvLanguage.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const languages = await getAppLanguages(ctx.db);
      await ctx.db.cvLanguage.update({ where: { id }, data });
      await upsertLanguageTranslations(ctx.db, languages, id, name, level);

      return ctx.db.cvLanguage.findUniqueOrThrow({
        where: { id },
        include: { translations: true },
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
        role: CvTextTranslationMapSchema,
        location: CvTextTranslationMapSchema.optional(),
        companyBlurb: CvTextTranslationMapSchema.optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        current: z.boolean().default(false),
        featuredOnHome: z.boolean().default(false),
        skillIds: z.array(z.string()).default([]),
        order: z.number().int().nonnegative().default(0),
        responsibilities: z
          .array(
            z.object({
              text: CvTextTranslationMapSchema,
              order: z.number().int().nonnegative().default(0),
              atsOnly: z.boolean().default(false),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        responsibilities,
        role,
        location,
        companyBlurb,
        skillIds,
        ...rest
      } = input;
      const languages = await getAppLanguages(ctx.db);
      const dates = normalizeEmploymentDates(rest);

      return ctx.db.cvExperience.create({
        data: {
          ...rest,
          ...dates,
          userId: ctx.user.id,
          translations: {
            create: buildExperienceTranslationCreates(
              languages,
              role,
              location,
              companyBlurb,
            ),
          },
          CvExperienceSkill: skillIds.length
            ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
            : undefined,
          responsibilities: responsibilities.length
            ? {
                create: responsibilities.map((responsibility) => ({
                  order: responsibility.order,
                  atsOnly: responsibility.atsOnly,
                  translations: {
                    create: buildResponsibilityTranslationCreates(
                      languages,
                      responsibility.text,
                    ),
                  },
                })),
              }
            : undefined,
        },
        include: {
          translations: true,
          responsibilities: { include: { translations: true } },
          CvExperienceSkill: { include: { skill: true } },
        },
      });
    }),
  updateExperience: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        company: z.string().min(1),
        role: CvTextTranslationMapSchema,
        location: CvTextTranslationMapSchema.optional(),
        companyBlurb: CvTextTranslationMapSchema.optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        current: z.boolean().default(false),
        featuredOnHome: z.boolean().default(false),
        skillIds: z.array(z.string()).default([]),
        order: z.number().int().nonnegative().default(0),
        responsibilities: z
          .array(
            z.object({
              text: CvTextTranslationMapSchema,
              order: z.number().int().nonnegative().default(0),
              atsOnly: z.boolean().default(false),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        id,
        responsibilities,
        role,
        location,
        companyBlurb,
        skillIds,
        ...data
      } = input;
      const existing = await ctx.db.cvExperience.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const languages = await getAppLanguages(ctx.db);

      await ctx.db.cvResponsibility.deleteMany({
        where: { experienceId: id },
      });
      await ctx.db.cvExperienceSkill.deleteMany({
        where: { experienceId: id },
      });
      if (skillIds.length > 0) {
        await ctx.db.cvExperienceSkill.createMany({
          data: skillIds.map((skillId) => ({ experienceId: id, skillId })),
        });
      }

      await ctx.db.cvExperience.update({
        where: { id },
        data: {
          ...data,
          ...normalizeEmploymentDates(data),
        },
      });
      await upsertExperienceTranslations(
        ctx.db,
        languages,
        id,
        role,
        location,
        companyBlurb,
      );

      if (responsibilities.length > 0) {
        for (const responsibility of responsibilities) {
          await ctx.db.cvResponsibility.create({
            data: {
              experienceId: id,
              order: responsibility.order,
              atsOnly: responsibility.atsOnly,
              translations: {
                create: buildResponsibilityTranslationCreates(
                  languages,
                  responsibility.text,
                ),
              },
            },
          });
        }
      }

      return ctx.db.cvExperience.findUniqueOrThrow({
        where: { id },
        include: {
          translations: true,
          responsibilities: {
            include: { translations: true },
            orderBy: { order: "asc" },
          },
          CvExperienceSkill: { include: { skill: true } },
        },
      });
    }),
  syncExperienceSkills: protectedProcedure
    .input(
      z.object({
        experienceId: z.string(),
        skillIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvExperience.findUnique({
        where: { id: input.experienceId },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.cvExperienceSkill.deleteMany({
        where: { experienceId: input.experienceId },
      });
      if (input.skillIds.length > 0) {
        await ctx.db.cvExperienceSkill.createMany({
          data: input.skillIds.map((skillId) => ({
            experienceId: input.experienceId,
            skillId,
          })),
        });
      }
      return ctx.db.cvExperience.findUnique({
        where: { id: input.experienceId },
        include: { CvExperienceSkill: { include: { skill: true } } },
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
        name: CvTextTranslationMapSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, ...rest } = input;
      const languages = await getAppLanguages(ctx.db);

      return ctx.db.cvSoftSkill.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          translations: {
            create: languages.map((lang) => ({
              appLanguageId: lang.id,
              name: name[lang.id]?.text ?? "",
            })),
          },
        },
        include: { translations: true },
      });
    }),
  updateSoftSkill: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: CvTextTranslationMapSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, ...rest } = input;
      const existing = await ctx.db.cvSoftSkill.findUnique({ where: { id } });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const languages = await getAppLanguages(ctx.db);
      await ctx.db.cvSoftSkill.update({ where: { id }, data: rest });

      for (const lang of languages) {
        const nameText = name[lang.id]?.text ?? "";
        const existing = await ctx.db.cvSoftSkillTranslation.findFirst({
          where: { cvSoftSkillId: id, appLanguageId: lang.id },
        });

        if (existing) {
          await ctx.db.cvSoftSkillTranslation.update({
            where: { id: existing.id },
            data: { name: nameText },
          });
        } else {
          await ctx.db.cvSoftSkillTranslation.create({
            data: {
              cvSoftSkillId: id,
              appLanguageId: lang.id,
              name: nameText,
            },
          });
        }
      }

      return ctx.db.cvSoftSkill.findUniqueOrThrow({
        where: { id },
        include: { translations: true },
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
        text: CvTextTranslationMapSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { text, ...rest } = input;
      const languages = await getAppLanguages(ctx.db);

      return ctx.db.cvAdditionalInfo.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          translations: {
            create: languages.map((lang) => ({
              appLanguageId: lang.id,
              text: text[lang.id]?.text ?? "",
            })),
          },
        },
        include: { translations: true },
      });
    }),
  updateAdditionalInfo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        text: CvTextTranslationMapSchema,
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

      const languages = await getAppLanguages(ctx.db);
      await ctx.db.cvAdditionalInfo.update({ where: { id }, data: rest });

      for (const lang of languages) {
        const infoText = text[lang.id]?.text ?? "";
        const existing = await ctx.db.cvAdditionalInfoTranslation.findFirst({
          where: { cvAdditionalInfoId: id, appLanguageId: lang.id },
        });

        if (existing) {
          await ctx.db.cvAdditionalInfoTranslation.update({
            where: { id: existing.id },
            data: { text: infoText },
          });
        } else {
          await ctx.db.cvAdditionalInfoTranslation.create({
            data: {
              cvAdditionalInfoId: id,
              appLanguageId: lang.id,
              text: infoText,
            },
          });
        }
      }

      return ctx.db.cvAdditionalInfo.findUniqueOrThrow({
        where: { id },
        include: { translations: true },
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

  // ---------- Personal references ----------
  createPersonalReference: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        contact: z.string().nullable().optional(),
        role: CvTextTranslationMapSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { role, contact, ...rest } = input;
      const languages = await getAppLanguages(ctx.db);

      return ctx.db.cvPersonalReference.create({
        data: {
          ...rest,
          contact: contact?.trim() ? contact.trim() : null,
          userId: ctx.user.id,
          translations: {
            create: languages.map((lang) => ({
              appLanguageId: lang.id,
              role: role[lang.id]?.text ?? "",
            })),
          },
        },
        include: { translations: true },
      });
    }),
  updatePersonalReference: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        contact: z.string().nullable().optional(),
        role: CvTextTranslationMapSchema,
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, role, contact, ...rest } = input;
      const existing = await ctx.db.cvPersonalReference.findUnique({
        where: { id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const languages = await getAppLanguages(ctx.db);
      await ctx.db.cvPersonalReference.update({
        where: { id },
        data: {
          ...rest,
          contact: contact?.trim() ? contact.trim() : null,
        },
      });

      for (const lang of languages) {
        const roleText = role[lang.id]?.text ?? "";
        const existingTranslation =
          await ctx.db.cvPersonalReferenceTranslation.findFirst({
            where: { cvPersonalReferenceId: id, appLanguageId: lang.id },
          });

        if (existingTranslation) {
          await ctx.db.cvPersonalReferenceTranslation.update({
            where: { id: existingTranslation.id },
            data: { role: roleText },
          });
        } else {
          await ctx.db.cvPersonalReferenceTranslation.create({
            data: {
              cvPersonalReferenceId: id,
              appLanguageId: lang.id,
              role: roleText,
            },
          });
        }
      }

      return ctx.db.cvPersonalReference.findUniqueOrThrow({
        where: { id },
        include: { translations: true },
      });
    }),
  deletePersonalReference: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.cvPersonalReference.findUnique({
        where: { id: input.id },
      });
      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cvPersonalReference.delete({ where: { id: input.id } });
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
        logoInitials: z.string().max(8).optional(),
        logoImageUrl: z.string().url().or(z.literal("")).optional(),
        defaultLocale: z.enum(["en", "es", "nl"]),
        isPublished: z.boolean().default(false),
        mapLocationLabel: z.string().max(160).optional(),
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

      const trimmedMapLocation = input.mapLocationLabel?.trim();
      const mapLocationLabel =
        trimmedMapLocation && trimmedMapLocation.length > 0
          ? trimmedMapLocation
          : null;
      const geocoded = mapLocationLabel
        ? await geocodePlace(mapLocationLabel)
        : null;

      const mapFields = {
        mapLocationLabel,
        mapLatitude: geocoded?.lat ?? null,
        mapLongitude: geocoded?.lon ?? null,
      };

      const logoFields = {
        ...(input.logoInitials !== undefined
          ? {
              logoInitials: input.logoInitials.trim()
                ? input.logoInitials.trim()
                : null,
            }
          : {}),
        ...(input.logoImageUrl !== undefined
          ? {
              logoImageUrl: input.logoImageUrl.trim()
                ? input.logoImageUrl.trim()
                : null,
            }
          : {}),
      };

      // Omit customDomain on create so MongoDB does not store an explicit null
      // under a legacy unique index (only one null was allowed).
      return ctx.db.profile.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          username: input.username,
          displayName: input.displayName,
          ...logoFields,
          defaultLocale: input.defaultLocale,
          isPublished: input.isPublished,
          ...mapFields,
        },
        update: {
          username: input.username,
          displayName: input.displayName,
          ...logoFields,
          defaultLocale: input.defaultLocale,
          isPublished: input.isPublished,
          ...mapFields,
        },
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
        paginatePages: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const paginatePages = input.paginatePages ?? false;

      return ctx.db.cvPdfLink.upsert({
        where: {
          userId_locale_paginatePages: {
            userId: ctx.user.id,
            locale: input.locale,
            paginatePages,
          },
        },
        create: {
          userId: ctx.user.id,
          locale: input.locale,
          paginatePages,
          url: input.url,
          label: input.label,
          contentHash: null,
          storageKey: null,
          generatedAt: null,
        },
        update: {
          url: input.url,
          label: input.label,
          contentHash: null,
          storageKey: null,
          generatedAt: null,
        },
      });
    }),

  /** Removes the PDF link for a given locale. Silently succeeds if not found. */
  deletePdfLink: protectedProcedure
    .input(
      z.object({
        locale: z.string(),
        paginatePages: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const paginatePages = input.paginatePages ?? false;
      const existing = await ctx.db.cvPdfLink.findUnique({
        where: {
          userId_locale_paginatePages: {
            userId: ctx.user.id,
            locale: input.locale,
            paginatePages,
          },
        },
      });
      if (!existing) return null;
      return ctx.db.cvPdfLink.delete({
        where: {
          userId_locale_paginatePages: {
            userId: ctx.user.id,
            locale: input.locale,
            paginatePages,
          },
        },
      });
    }),

  regeneratePdfCache: protectedProcedure
    .input(
      z.object({
        locale: z.enum(["en", "es", "nl"]),
        paginatePages: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.profile.findUnique({
        where: { userId: ctx.user.id },
        select: { username: true, defaultLocale: true },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      const asset = await resolveCvPdfAsset(
        ctx.user.id,
        profile.username,
        input.locale,
        profile.defaultLocale as "en" | "es" | "nl",
        {
          paginatePages: input.paginatePages ?? false,
          forceRegenerate: true,
        },
      );

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "CV data is not available",
        });
      }

      return {
        url: asset.url,
        contentHash: asset.contentHash,
        fromCache: asset.fromCache,
      };
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
  reorderPersonalReferences: protectedProcedure
    .input(
      z.array(
        z.object({ id: z.string(), order: z.number().int().nonnegative() }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.cvPersonalReference.update({
            where: { id: item.id, userId: ctx.user.id },
            data: { order: item.order },
          }),
        ),
      );
    }),
});
