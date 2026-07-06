import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

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

        return {
          ...rest,
          ...CertificationTranslation[0],
        };
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
          return {
            ...val,
            ...SkillTranslation[0],
          };
        });

        return {
          skills,
          ...rest,
          ...ProjectTranslation[0],
        };
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

        return {
          ...rest,
          ...SkillTranslation[0],
        };
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

      const timelineItems = await ctx.db.timelineItem.findMany({
        where: { userId: tenantUserId },
        orderBy: [{ order: "asc" }, { startDate: "desc" }],
      });

      const parseLocalized = (field: unknown) => {
        if (!field || typeof field !== "object") return "";

        const value = field as {
          default?: string;
          translations?: Record<string, string | undefined>;
        };

        const localized = value.translations?.[input.locale];
        if (localized?.trim()) {
          return localized;
        }

        return value.default ?? "";
      };

      const formatDate = (
        startDate: Date,
        endDate: Date | null,
        current: boolean,
      ) => {
        const startYear = startDate.getFullYear();

        if (current) {
          return `${startYear} - Present`;
        }

        if (endDate) {
          return `${startYear} - ${endDate.getFullYear()}`;
        }

        return `${startYear}`;
      };

      return timelineItems.map((item) => {
        const title = parseLocalized(item.title);
        const description = parseLocalized(item.description);

        return {
          id: item.id,
          title: item.organization ? `${title} - ${item.organization}` : title,
          description,
          date: formatDate(item.startDate, item.endDate ?? null, item.current),
          dateTime: item.startDate.toISOString().split("T")[0],
        };
      });
    }),
});
