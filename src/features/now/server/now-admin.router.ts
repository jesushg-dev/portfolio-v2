import { getGitHubContributions } from "./github-contributions";
import { getGitHubActivity } from "./github-activity";
import { TRPCError } from "@trpc/server";
import { nowTabSchema } from "../lib/now-settings-schema";
import { saveNowTab } from "./now-settings-persistence";
import { z } from "zod";

import { assertOwner } from "@/features/portfolio/server/portfolio-admin-shared";
import {
  buildEmptyNowFocusCreateDto,
  mapNowFocusToEditorDto,
  mapNowFocusesToEditorDto,
  mapNowSettingsToEditorDto,
  nowSettingsEditorInclude,
} from "@/features/now/lib/now-editor-dto";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const NowFocusTranslationMapSchema = z.record(
  z.string(),
  z.object({
    label: z.string(),
    body: z.string(),
  }),
);

const nowFocusUpsertInput = z.object({
  translations: NowFocusTranslationMapSchema,
});

export const nowAdminRouter = createTRPCRouter({
  getGithubActivity: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.nowSettings.findUnique({
      where: { userId: ctx.user.id },
      select: { githubUsername: true },
    });
    return getGitHubActivity(ctx.user.id, settings?.githubUsername ?? null);
  }),
  getGithubContributions: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.nowSettings.findUnique({
      where: { userId: ctx.user.id },
      select: { githubUsername: true },
    });
    return getGitHubContributions(
      ctx.user.id,
      settings?.githubUsername ?? null,
    );
  }),
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const languages = await ctx.db.appLanguage.findMany({
      orderBy: { code: "asc" },
    });
    const existing = await ctx.db.nowSettings.findUnique({
      where: { userId: ctx.user.id },
      include: nowSettingsEditorInclude,
    });
    if (existing) return mapNowSettingsToEditorDto(existing, languages);

    const created = await ctx.db.nowSettings.create({
      data: {
        userId: ctx.user.id,
        NowSettingsTranslation: {
          createMany: {
            data: languages.map((lang) => ({
              appLanguageId: lang.id,
              statusBody: "",
              statusRelative: "",
            })),
          },
        },
      },
      include: nowSettingsEditorInclude,
    });
    return mapNowSettingsToEditorDto(created, languages);
  }),

  saveTab: protectedProcedure
    .input(nowTabSchema)
    .mutation(({ ctx, input }) => saveNowTab(ctx.db, ctx.user.id, input)),

  getFocuses: protectedProcedure.query(async ({ ctx }) => {
    const languages = await ctx.db.appLanguage.findMany({
      orderBy: { code: "asc" },
    });
    const focuses = await ctx.db.nowFocus.findMany({
      where: { userId: ctx.user.id },
      include: { NowFocusTranslation: true },
      orderBy: { order: "asc" },
    });
    return mapNowFocusesToEditorDto(focuses, languages);
  }),

  createFocus: protectedProcedure
    .input(nowFocusUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations } = input;
      const last = await ctx.db.nowFocus.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const translationRows = translationMapEntries(translations);
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const created = await ctx.db.nowFocus.create({
        data: {
          userId: ctx.user.id,
          order: (last?.order ?? -1) + 1,
          NowFocusTranslation: translationRows.length
            ? { createMany: { data: translationRows } }
            : undefined,
        },
        include: { NowFocusTranslation: true },
      });
      return mapNowFocusToEditorDto(created, languages);
    }),

  updateFocus: protectedProcedure
    .input(nowFocusUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations } = input;
      await assertOwner(
        await ctx.db.nowFocus.findUnique({ where: { id } }),
        ctx.user.id,
      );

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      for (const [appLanguageId, fields] of Object.entries(translations)) {
        const existing = await ctx.db.nowFocusTranslation.findFirst({
          where: { nowFocusId: id, appLanguageId },
        });
        if (existing) {
          await ctx.db.nowFocusTranslation.update({
            where: { id: existing.id },
            data: fields,
          });
        } else {
          await ctx.db.nowFocusTranslation.create({
            data: { nowFocusId: id, appLanguageId, ...fields },
          });
        }
      }

      const updated = await ctx.db.nowFocus.findUniqueOrThrow({
        where: { id },
        include: { NowFocusTranslation: true },
      });
      return mapNowFocusToEditorDto(updated, languages);
    }),

  reorderFocuses: protectedProcedure
    .input(
      z.object({
        ids: z
          .array(z.string().regex(/^[a-f0-9]{24}$/i))
          .refine((ids) => new Set(ids).size === ids.length),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(async (tx) => {
        const owned = await tx.nowFocus.findMany({
          where: { userId: ctx.user.id },
          select: { id: true },
        });
        const ids = new Set(input.ids);
        if (
          owned.length !== ids.size ||
          owned.some((item) => !ids.has(item.id))
        )
          throw new TRPCError({
            code: "CONFLICT",
            message: "Focus list changed. Refresh and try again.",
          });
        for (const [order, id] of input.ids.entries())
          await tx.nowFocus.update({ where: { id }, data: { order } });
      });
      return { success: true };
    }),

  deleteFocus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.nowFocus.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );
      await ctx.db.nowFocusTranslation.deleteMany({
        where: { nowFocusId: input.id },
      });
      await ctx.db.nowFocus.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  emptyFocusCreateDto: protectedProcedure.query(async ({ ctx }) => {
    const languages = await ctx.db.appLanguage.findMany({
      orderBy: { code: "asc" },
    });
    return {
      initialData: buildEmptyNowFocusCreateDto(languages),
      languages,
    };
  }),
});
