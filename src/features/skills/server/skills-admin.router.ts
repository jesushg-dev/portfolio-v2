import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  assertOwner,
  StackTypeSchema,
} from "@/features/portfolio/server/portfolio-admin-shared";
import {
  mapSkillToEditorDto,
  mapSkillsToEditorDto,
} from "@/features/skills/lib/skill-editor-dto";
import { translationMapEntries } from "@/lib/i18n/translation-map";

const SkillTranslationMapSchema = z.record(
  z.string(),
  z.object({
    description: z.string(),
    urlWiki: z.string().url().or(z.literal("")).optional().default(""),
  }),
);

const skillUpsertInput = z.object({
  title: z.string().min(1),
  image: z.string().min(1),
  type: StackTypeSchema,
  translations: SkillTranslationMapSchema.default({}),
});

export const skillsAdminRouter = createTRPCRouter({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const [skills, languages] = await Promise.all([
      ctx.db.skill.findMany({
        where: { userId: ctx.user.id },
        include: {
          SkillTranslation: true,
          _count: { select: { ProjectSkill: true, CertificateSkill: true } },
        },
        orderBy: { title: "asc" },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);

    return mapSkillsToEditorDto(skills, languages);
  }),

  createItem: protectedProcedure
    .input(skillUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations, ...rest } = input;
      const translationRows = translationMapEntries(translations);

      const duplicate = await ctx.db.skill.findFirst({
        where: { userId: ctx.user.id, title: rest.title },
        select: { id: true },
      });
      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a skill titled "${rest.title}".`,
        });
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const created = await ctx.db.skill.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          SkillTranslation: translationRows.length
            ? { createMany: { data: translationRows } }
            : undefined,
        },
        include: {
          SkillTranslation: true,
          _count: { select: { ProjectSkill: true, CertificateSkill: true } },
        },
      });

      return mapSkillToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(skillUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations, ...data } = input;
      await assertOwner(
        await ctx.db.skill.findUnique({ where: { id } }),
        ctx.user.id,
      );

      const duplicate = await ctx.db.skill.findFirst({
        where: {
          userId: ctx.user.id,
          title: data.title,
          NOT: { id },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a skill titled "${data.title}".`,
        });
      }

      await ctx.db.skill.update({ where: { id }, data });
      for (const translation of translationMapEntries(translations).filter(
        (entry) =>
          entry.description.trim() !== "" || entry.urlWiki.trim() !== "",
      )) {
        const existing = await ctx.db.skillTranslation.findFirst({
          where: { skillId: id, appLanguageId: translation.appLanguageId },
        });
        if (existing) {
          await ctx.db.skillTranslation.update({
            where: { id: existing.id },
            data: {
              description: translation.description,
              urlWiki: translation.urlWiki,
            },
          });
        } else {
          await ctx.db.skillTranslation.create({
            data: { skillId: id, ...translation },
          });
        }
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const updated = await ctx.db.skill.findUnique({
        where: { id },
        include: {
          SkillTranslation: true,
          _count: { select: { ProjectSkill: true, CertificateSkill: true } },
        },
      });

      return mapSkillToEditorDto(updated!, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.skill.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );

      return ctx.db.$transaction(async (tx) => {
        await tx.projectSkill.deleteMany({ where: { skillId: input.id } });
        await tx.certificateSkill.deleteMany({ where: { skillId: input.id } });
        await tx.serviceSkill.deleteMany({ where: { skillId: input.id } });
        await tx.cvExperienceSkill.deleteMany({ where: { skillId: input.id } });
        await tx.skillTranslation.deleteMany({ where: { skillId: input.id } });
        return tx.skill.delete({ where: { id: input.id } });
      });
    }),
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.skill.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };

    return ctx.db.$transaction(async (tx) => {
      await tx.projectSkill.deleteMany({ where: { skillId: { in: ids } } });
      await tx.certificateSkill.deleteMany({ where: { skillId: { in: ids } } });
      await tx.serviceSkill.deleteMany({ where: { skillId: { in: ids } } });
      await tx.cvExperienceSkill.deleteMany({
        where: { skillId: { in: ids } },
      });
      await tx.skillTranslation.deleteMany({ where: { skillId: { in: ids } } });
      return tx.skill.deleteMany({ where: { id: { in: ids } } });
    });
  }),
});
