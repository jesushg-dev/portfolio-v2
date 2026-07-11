import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  assertOwner,
  optionalUrl,
  StackTypeSchema,
} from "@/lib/admin/portfolio-schemas";
import {
  mapProjectToEditorDto,
  mapProjectsToEditorDto,
} from "@/features/projects/lib/project-editor-dto";
import { translationMapEntries } from "@/lib/i18n/translation-map";

const ProjectTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
  }),
);

const projectUpsertInput = z.object({
  image: z.string().min(1),
  type: StackTypeSchema,
  githubUrl: optionalUrl,
  websiteUrl: optionalUrl,
  isPrivate: z.boolean().default(false),
  skillIds: z.array(z.string()).default([]),
  translations: ProjectTranslationMapSchema.default({}),
});

export const projectsAdminRouter = createTRPCRouter({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const [projects, languages] = await Promise.all([
      ctx.db.project.findMany({
        where: { userId: ctx.user.id },
        include: {
          ProjectTranslation: true,
          ProjectSkill: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);

    return mapProjectsToEditorDto(projects, languages);
  }),

  createItem: protectedProcedure
    .input(projectUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations, skillIds, ...rest } = input;
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const translationRows = translationMapEntries(translations);

      const created = await ctx.db.project.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          ProjectTranslation: translationRows.length
            ? { createMany: { data: translationRows } }
            : undefined,
          ProjectSkill: skillIds.length
            ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
            : undefined,
        },
        include: { ProjectTranslation: true, ProjectSkill: true },
      });

      return mapProjectToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(projectUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, skillIds, translations, ...data } = input;
      await assertOwner(
        await ctx.db.project.findUnique({ where: { id } }),
        ctx.user.id,
      );

      await ctx.db.project.update({ where: { id }, data });
      await ctx.db.projectSkill.deleteMany({ where: { projectId: id } });
      if (skillIds.length > 0) {
        await ctx.db.projectSkill.createMany({
          data: skillIds.map((skillId) => ({ projectId: id, skillId })),
        });
      }
      for (const translation of translationMapEntries(translations)) {
        const existing = await ctx.db.projectTranslation.findFirst({
          where: { projectId: id, appLanguageId: translation.appLanguageId },
        });
        if (existing) {
          await ctx.db.projectTranslation.update({
            where: { id: existing.id },
            data: {
              title: translation.title,
              description: translation.description,
            },
          });
        } else {
          await ctx.db.projectTranslation.create({
            data: { projectId: id, ...translation },
          });
        }
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const updated = await ctx.db.project.findUnique({
        where: { id },
        include: { ProjectTranslation: true, ProjectSkill: true },
      });

      return mapProjectToEditorDto(updated!, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.project.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );

      return ctx.db.$transaction(async (tx) => {
        await tx.projectSkill.deleteMany({ where: { projectId: input.id } });
        await tx.projectTranslation.deleteMany({
          where: { projectId: input.id },
        });
        await tx.certificateProject.deleteMany({
          where: { projectId: input.id },
        });
        return tx.project.delete({ where: { id: input.id } });
      });
    }),
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.project.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };

    return ctx.db.$transaction(async (tx) => {
      await tx.projectSkill.deleteMany({ where: { projectId: { in: ids } } });
      await tx.projectTranslation.deleteMany({
        where: { projectId: { in: ids } },
      });
      await tx.certificateProject.deleteMany({
        where: { projectId: { in: ids } },
      });
      return tx.project.deleteMany({ where: { id: { in: ids } } });
    });
  }),
});
