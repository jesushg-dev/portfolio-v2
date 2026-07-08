import { z } from "zod";

import { getLocalizedText } from "@/lib/i18n/localized";
import {
  getHeroTitlesForLocale,
  splitAboutParagraphs,
} from "@/features/profile/server/hero-titles";
import { mapTimelineItemsToPublic } from "@/features/timeline/lib/map-timeline-public";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  looksLikeSkillObjectId,
  skillSlugFromTitle,
} from "@/utils/tools/skill-slug";

const LanguageCode = z.enum(["es", "en", "nl"]);
const StackType = z.enum([
  "FRONTEND",
  "BACKEND",
  "MOBILE",
  "DESKTOP",
  "CYBERSECURITY",
  "DEVOPS",
  "SOFTSKILLS",
  "TOOLS",
]);

/** Merge translation fields onto an entity without overwriting its primary `id`. */
function mergeTranslation<
  T extends { id: string },
  U extends { id?: string } | undefined,
>(entity: T, translation: U): T & Omit<NonNullable<U>, "id"> {
  if (!translation) {
    return entity as T & Omit<NonNullable<U>, "id">;
  }
  const translationFields = { ...translation };
  delete translationFields.id;
  return { ...entity, ...translationFields };
}

export const portfolioRouter = createTRPCRouter({
  getCertificates: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().nullish(),
        keyword: z.string().optional(),
        type: z.array(StackType).optional(),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, type, locale } = input;
      const tenantUserId = ctx.tenant?.userId ?? null;

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      // get certifications with translations (scoped to tenant when present)
      const baseWhere = {
        ...(type ? { type: { hasSome: type } } : {}),
        ...(tenantUserId ? { userId: tenantUserId } : {}),
      };

      const data = await ctx.db.certification.findMany({
        include: {
          CertificationTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        where: baseWhere,
        cursor: cursor ? { id: cursor } : undefined,
      });

      // first CertificationTranslation data should be at the same level as Certification object
      const dataWithTranslation = data.map((certification) => {
        const { CertificationTranslation, ...rest } = certification;

        return mergeTranslation(rest, CertificationTranslation[0]);
      });

      const lastCursor = data[data.length - 1]?.id ?? null;

      // check if there are more certificates to fetch (also tenant-scoped)
      const hasMore = await ctx.db.certification.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        cursor: lastCursor ? { id: lastCursor } : undefined,
        where: baseWhere,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
  getProjects: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().nullish(),
        keyword: z.string().optional(),
        type: StackType.optional(),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, locale, cursor, type } = input;
      const tenantUserId = ctx.tenant?.userId ?? null;

      // get language selected
      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      const projectWhere = {
        ...(type ? { type } : {}),
        ...(tenantUserId ? { userId: tenantUserId } : {}),
      };

      // get projects with skills and translations (tenant-scoped when present)
      const data = await ctx.db.project.findMany({
        include: {
          ProjectTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
          ProjectSkill: {
            include: {
              Skill: {
                include: {
                  SkillTranslation: {
                    where: {
                      appLanguageId: appLanguage?.id,
                    },
                  },
                },
              },
            },
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        where: projectWhere,
        cursor: cursor ? { id: cursor } : undefined,
      });

      // first ProjectTranslation data should be at the same level as Project object
      const dataWithTranslation = data.map((project) => {
        const { ProjectTranslation, ProjectSkill, ...rest } = project;

        const skills = ProjectSkill.map(({ Skill }) => {
          const { SkillTranslation, ...val } = Skill;
          return mergeTranslation(val, SkillTranslation[0]);
        });

        return mergeTranslation({ skills, ...rest }, ProjectTranslation[0]);
      });

      const lastCursor = data[data.length - 1]?.id ?? null;

      // check if there are more projects to fetch (tenant-scoped)
      const hasMore = await ctx.db.project.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        where: projectWhere,
        cursor: lastCursor ? { id: lastCursor } : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
  getSkills: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().nullish(),
        keyword: z.string().optional(),
        type: z.array(StackType).optional(),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, type, locale, cursor } = input;
      const tenantUserId = ctx.tenant?.userId ?? null;

      // get language selected
      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      const skillWhere = {
        ...(type ? { type: { in: type } } : {}),
        ...(tenantUserId ? { userId: tenantUserId } : {}),
      };

      // get skills with translations (tenant-scoped when present)
      const data = await ctx.db.skill.findMany({
        include: {
          SkillTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        where: skillWhere,
        cursor: cursor ? { id: cursor } : undefined,
      });

      // first SkillTranslation data should be at the same level as Skill object
      const dataWithTranslation = data.map((skill) => {
        const { SkillTranslation, ...rest } = skill;

        return mergeTranslation(rest, SkillTranslation[0]);
      });

      const lastCursor = data[data.length - 1]?.id ?? null;

      // check if there are more skills to fetch (tenant-scoped)
      const hasMore = await ctx.db.skill.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        where: skillWhere,
        cursor: lastCursor ? { id: lastCursor } : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
  getSkillDetail: publicProcedure
    .input(
      z.object({
        /** URL segment: title slug (e.g. `next-js`) or legacy ObjectId. */
        slug: z.string().min(1),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const skillInclude = {
        SkillTranslation: {
          where: { appLanguageId: appLanguage?.id },
        },
        CertificateSkill: {
          include: {
            Certification: {
              include: {
                CertificationTranslation: {
                  where: { appLanguageId: appLanguage?.id },
                },
              },
            },
          },
        },
        CvExperienceSkill: {
          include: { experience: true as const },
        },
        ProjectSkill: {
          include: {
            Project: {
              include: {
                ProjectTranslation: {
                  where: { appLanguageId: appLanguage?.id },
                },
                ProjectSkill: {
                  include: {
                    Skill: {
                      include: {
                        SkillTranslation: {
                          where: { appLanguageId: appLanguage?.id },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const tenantWhere = tenantUserId ? { userId: tenantUserId } : {};

      let skill = looksLikeSkillObjectId(input.slug)
        ? await ctx.db.skill.findFirst({
            where: { id: input.slug, ...tenantWhere },
            include: skillInclude,
          })
        : null;

      if (!skill) {
        const candidates = await ctx.db.skill.findMany({
          where: tenantWhere,
          include: skillInclude,
        });
        skill =
          candidates.find(
            (row) => skillSlugFromTitle(row.title) === input.slug,
          ) ?? null;
      }

      if (!skill) return null;

      const {
        SkillTranslation,
        CertificateSkill,
        CvExperienceSkill,
        ProjectSkill,
        ...rest
      } = skill;

      const formatExperienceDates = (
        dates: string | null,
        startDate: Date | null,
        endDate: Date | null,
        current: boolean,
      ) => {
        if (dates?.trim()) return dates;
        if (!startDate) return "";
        const startYear = startDate.getFullYear();
        if (current) return `${startYear} – Present`;
        if (endDate) return `${startYear} – ${endDate.getFullYear()}`;
        return `${startYear}`;
      };

      const certificates = CertificateSkill.map(({ Certification }) => {
        const { CertificationTranslation, ...cert } = Certification;
        return mergeTranslation(cert, CertificationTranslation[0]);
      });

      const experiences = CvExperienceSkill.map(({ experience }) => ({
        id: experience.id,
        company: experience.company,
        role: getLocalizedText(experience.role, input.locale),
        dates: formatExperienceDates(
          experience.dates,
          experience.startDate,
          experience.endDate,
          experience.current,
        ),
        order: experience.order,
      })).sort((a, b) => a.order - b.order);

      const projects = ProjectSkill.map(({ Project }) => {
        const {
          ProjectTranslation,
          ProjectSkill: nestedSkills,
          ...project
        } = Project;

        const skills = nestedSkills.map(({ Skill }) => {
          const { SkillTranslation, ...val } = Skill;
          return mergeTranslation(val, SkillTranslation[0]);
        });

        return mergeTranslation({ ...project, skills }, ProjectTranslation[0]);
      });

      return {
        ...mergeTranslation(rest, SkillTranslation[0]),
        certificates,
        experiences,
        projects,
      };
    }),
  getTimelinePublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
        limit: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;

      if (!tenantUserId) {
        return [];
      }

      const defaultLocale = (ctx.tenant?.defaultLocale ?? "en");
      const locale = input.locale;

      const timelineItems = await ctx.db.timelineItem.findMany({
        where: { userId: tenantUserId },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      });

      return mapTimelineItemsToPublic(
        timelineItems,
        locale,
        defaultLocale,
        input.limit,
      );
    }),

  getTimeline: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;

      if (!tenantUserId) {
        return [];
      }

      const defaultLocale = (ctx.tenant?.defaultLocale ?? "en");
      const locale = input.locale;

      const timelineItems = await ctx.db.timelineItem.findMany({
        where: { userId: tenantUserId },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      });

      return mapTimelineItemsToPublic(timelineItems, locale, defaultLocale).map(
        (item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          date: item.date,
          dateTime: item.dateTime,
        }),
      );
    }),

  getHeroPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return null;

      const header = await ctx.db.cvHeader.findUnique({
        where: { userId: tenantUserId },
      });

      if (!header) return null;

      const profile = await ctx.db.profile.findUnique({
        where: { userId: tenantUserId },
        select: { displayName: true },
      });

      const defaultLocale = (ctx.tenant?.defaultLocale ?? "en");
      const locale = input.locale;

      const titles = await getHeroTitlesForLocale(
        ctx.db,
        tenantUserId,
        locale,
        defaultLocale,
      );

      return {
        fullName: profile?.displayName?.trim() ?? header.fullName,
        photoUrl: header.photoUrl,
        backgroundImageUrl: header.backgroundImageUrl,
        heroSummary: getLocalizedText(
          header.heroSummary,
          locale,
          defaultLocale,
        ),
        imageAlt: getLocalizedText(
          header.clientImageAlt,
          locale,
          defaultLocale,
        ),
        titles,
      };
    }),

  getAboutPublic: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return null;

      const defaultLocale = (ctx.tenant?.defaultLocale ?? "en");
      const locale = input.locale;

      const [aboutMe, terminal] = await Promise.all([
        ctx.db.cvAboutMe.findUnique({ where: { userId: tenantUserId } }),
        ctx.db.cvTerminal.findUnique({
          where: { userId: tenantUserId },
          include: { steps: true },
        }),
      ]);

      const aboutText = getLocalizedText(
        aboutMe?.aboutMe,
        locale,
        defaultLocale,
      );

      return {
        paragraphs: splitAboutParagraphs(aboutText),
        hasTerminal: Boolean(terminal && terminal.steps.length > 0),
      };
    }),
});
