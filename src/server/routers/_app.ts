import { z } from "zod";

import { getNowPlaying, getTopTracks } from "@/utils/services/spotify";

import { router, procedure } from "../trpc";

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

export const appRouter = router({
  getNowPlaying: procedure.input(z.undefined()).query(async () => {
    const data = await getNowPlaying();
    return data;
  }),
  getTopTracks: procedure
    .input(
      z.object({
        timeRange: z.enum(["short_term", "medium_term", "long_term"]),
        limit: z.number(),
        offset: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const { timeRange, limit, offset } = input;
      const data = await getTopTracks(timeRange, limit, offset);
      return data;
    }),
  getCertificates: procedure
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

      const appLanguage = await ctx.prisma.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      // get certifications with translations
      const data = await ctx.prisma.certification.findMany({
        include: {
          CertificationTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        where: type
          ? {
              type: {
                hasSome: type,
              },
            }
          : undefined,
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

      const lastCursor = data[data.length - 1]?.id || null;

      // check if there are more projects to fetch
      const hasMore = await ctx.prisma.certification.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        cursor: lastCursor ? { id: lastCursor } : undefined,
        where: type
          ? {
              type: {
                hasSome: type,
              },
            }
          : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
  getProjects: procedure
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

      // get language selected
      const appLanguage = await ctx.prisma.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      // get projects with skills and translations
      const data = await ctx.prisma.project.findMany({
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
        where: type ? { type } : undefined,
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

      const lastCursor = data[data.length - 1]?.id || null;

      // check if there are more projects to fetch
      const hasMore = await ctx.prisma.project.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        where: type ? { type } : undefined,
        cursor: lastCursor ? { id: lastCursor } : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
  getSkills: procedure
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

      // get language selected
      const appLanguage = await ctx.prisma.appLanguage.findUnique({
        where: {
          code: locale,
        },
      });

      // get skills with translations
      const data = await ctx.prisma.skill.findMany({
        include: {
          SkillTranslation: {
            where: {
              appLanguageId: appLanguage?.id,
            },
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        where: type
          ? {
              type: {
                in: type,
              },
            }
          : undefined,
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

      const lastCursor = data[data.length - 1]?.id || null;

      // check if there are more skills to fetch
      const hasMore = await ctx.prisma.project.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        where: type
          ? {
              type: {
                in: type,
              },
            }
          : undefined,
        cursor: lastCursor ? { id: lastCursor } : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),
});

export type AppRouter = typeof appRouter;
