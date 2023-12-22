import { router, procedure } from '../trpc';
import { z } from 'zod';

import { getNowPlaying, getTopTracks } from '@/utils/services/spotify';

export const appRouter = router({
  getNowPlaying: procedure.input(z.undefined()).query(async ({}) => {
    const data = await getNowPlaying();
    return data;
  }),
  getTopTracks: procedure
    .input(
      z.object({
        timeRange: z.enum(['short_term', 'medium_term', 'long_term']),
        limit: z.number(),
        offset: z.number(),
      })
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
        type: z
          .enum(['FRONTEND', 'BACKEND', 'MOBILE', 'DESKTOP', 'CYBERSECURITY', 'DEVOPS', 'SOFTSKILLS', 'TOOLS'])
          .optional(),
        locale: z.enum(['es', 'en', 'nl']).optional().default('en'),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, keyword, locale, cursor, type } = input;

      // get certificates with translations
      const data = await ctx.prisma.certification.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: type ? { type } : undefined,
      });

      const lastCursor = data[data.length - 1]?.id || null;

      // check if there are more projects to fetch
      const hasMore = await ctx.prisma.certification.count({
        take: limit,
        skip: lastCursor ? 1 : 0,
        cursor: lastCursor ? { id: lastCursor } : undefined,
        where: type ? { type } : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data,
      };
    }),
  getProjects: procedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().nullish(),
        keyword: z.string().optional(),
        type: z.enum(['FRONTEND', 'BACKEND', 'MOBILE', 'DESKTOP']).optional(),
        locale: z.enum(['es', 'en', 'nl']).optional().default('en'),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, keyword, locale, cursor, type } = input;

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
          const { SkillTranslation, ...rest } = Skill;
          return {
            ...rest,
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
        type: z.enum(['FRONTEND', 'BACKEND', 'MOBILE', 'DESKTOP', 'TOOLS']).optional(),
        locale: z.enum(['es', 'en', 'nl']).optional().default('en'),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, keyword, type, locale, cursor } = input;

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
        where: type ? { type } : undefined,
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
        where: type ? { type } : undefined,
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
