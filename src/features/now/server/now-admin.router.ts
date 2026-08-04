import { z } from "zod";

import { assertOwner } from "@/features/portfolio/server/portfolio-admin-shared";
import {
  buildEmptyNowFocusCreateDto,
  mapNowFocusToEditorDto,
  mapNowFocusesToEditorDto,
  mapNowSettingsToEditorDto,
} from "@/features/now/lib/now-editor-dto";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const NowSettingsTranslationMapSchema = z.record(
  z.string(),
  z.object({
    statusBody: z.string(),
    statusRelative: z.string(),
    githubBody: z.string(),
    githubRelative: z.string(),
  }),
);

const nowSettingsUpsertInput = z.object({
  timezone: z.string().min(1),
  githubUsername: z.string().optional().default(""),
  statusEmoji: z.string().optional().default("🚀"),
  readingTitle: z.string().optional().default(""),
  readingAuthors: z.string().optional().default(""),
  readingProgress: z.number().int().min(0).max(100).default(0),
  watchedTitle: z.string().optional().default(""),
  watchedRating: z.number().int().min(0).max(5).default(0),
  githubRepo: z.string().optional().default(""),
  githubHref: z.string().optional().default(""),
  photoUrls: z.array(z.string()).max(6).default([]),
  translations: NowSettingsTranslationMapSchema,
});

const NowFocusTranslationMapSchema = z.record(
  z.string(),
  z.object({
    label: z.string(),
    body: z.string(),
  }),
);

const nowFocusUpsertInput = z.object({
  order: z.number().int().nonnegative().default(0),
  translations: NowFocusTranslationMapSchema,
});

export const nowAdminRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const languages = await ctx.db.appLanguage.findMany({
      orderBy: { code: "asc" },
    });
    const existing = await ctx.db.nowSettings.findUnique({
      where: { userId: ctx.user.id },
      include: { NowSettingsTranslation: true },
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
              githubBody: "",
              githubRelative: "",
            })),
          },
        },
      },
      include: { NowSettingsTranslation: true },
    });
    return mapNowSettingsToEditorDto(created, languages);
  }),

  upsertSettings: protectedProcedure
    .input(nowSettingsUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations, ...rest } = input;
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const settings = await ctx.db.nowSettings.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          timezone: rest.timezone,
          githubUsername: rest.githubUsername || null,
          statusEmoji: rest.statusEmoji,
          readingTitle: rest.readingTitle || null,
          readingAuthors: rest.readingAuthors || null,
          readingProgress: rest.readingProgress,
          watchedTitle: rest.watchedTitle || null,
          watchedRating: rest.watchedRating,
          githubRepo: rest.githubRepo || null,
          githubHref: rest.githubHref || null,
          photoUrls: rest.photoUrls,
        },
        update: {
          timezone: rest.timezone,
          githubUsername: rest.githubUsername || null,
          statusEmoji: rest.statusEmoji,
          readingTitle: rest.readingTitle || null,
          readingAuthors: rest.readingAuthors || null,
          readingProgress: rest.readingProgress,
          watchedTitle: rest.watchedTitle || null,
          watchedRating: rest.watchedRating,
          githubRepo: rest.githubRepo || null,
          githubHref: rest.githubHref || null,
          photoUrls: rest.photoUrls,
        },
      });

      for (const [appLanguageId, fields] of Object.entries(translations)) {
        const existing = await ctx.db.nowSettingsTranslation.findFirst({
          where: { nowSettingsId: settings.id, appLanguageId },
        });
        if (existing) {
          await ctx.db.nowSettingsTranslation.update({
            where: { id: existing.id },
            data: fields,
          });
        } else {
          await ctx.db.nowSettingsTranslation.create({
            data: {
              nowSettingsId: settings.id,
              appLanguageId,
              ...fields,
            },
          });
        }
      }

      const updated = await ctx.db.nowSettings.findUniqueOrThrow({
        where: { id: settings.id },
        include: { NowSettingsTranslation: true },
      });
      return mapNowSettingsToEditorDto(updated, languages);
    }),

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
      const { translations, order } = input;
      const translationRows = translationMapEntries(translations);
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const created = await ctx.db.nowFocus.create({
        data: {
          userId: ctx.user.id,
          order,
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
      const { id, translations, order } = input;
      await assertOwner(
        await ctx.db.nowFocus.findUnique({ where: { id } }),
        ctx.user.id,
      );

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      await ctx.db.nowFocus.update({ where: { id }, data: { order } });

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
