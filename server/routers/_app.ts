import { router, procedure } from '../trpc';
import { z } from 'zod';

export const appRouter = router({
  getProjects: procedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.string().nullish(),
        keyword: z.string().optional(),
        locale: z
          .string()
          .optional()
          .default('es')
          .refine((value) => {
            return ['es', 'en', 'fr'].includes(value);
          }),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, keyword, locale, cursor } = input;

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
        locale: z
          .string()
          .optional()
          .default('es')
          .refine((value) => {
            return ['es', 'en', 'fr'].includes(value);
          }),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, keyword, locale, cursor } = input;

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
        cursor: lastCursor ? { id: lastCursor } : undefined,
      });

      return {
        hasMore: hasMore >= 1,
        cursor: lastCursor,
        data: dataWithTranslation,
      };
    }),

  /*insertOne: procedure
    .input(
      z.object({
        title: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.groceryList.create({
        data: { title: input.title },
      });
    }),
  updateOne: procedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        checked: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...rest } = input;

      return await ctx.prisma.groceryList.update({
        where: { id },
        data: { ...rest },
      });
    }),
  deleteAll: procedure
    .input(
      z.object({
        ids: z.number().array(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { ids } = input;

      return await ctx.prisma.groceryList.deleteMany({
        where: {
          id: { in: ids },
        },
      });
    }),**/
});

export type AppRouter = typeof appRouter;
