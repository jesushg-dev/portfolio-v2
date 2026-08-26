import { z } from "zod";

import { extractStringFilter } from "@/lib/admin/filter-utils";
import { assertOwner } from "@/features/portfolio/server/portfolio-admin-shared";
import {
  buildEmptyUsesItemCreateDto,
  mapUsesItemToEditorDto,
  mapUsesItemsToEditorDto,
  mapUsesSettingsToEditorDto,
} from "@/features/uses/lib/uses-editor-dto";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";

const UsesItemTypeSchema = z.enum(["EVERYDAY", "SOFTWARE", "BROWSER"]);

const UsesItemTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string().optional().default(""),
  }),
);

const usesItemUpsertInput = z.object({
  type: UsesItemTypeSchema,
  href: z.string().url().or(z.literal("")),
  image: z.string().optional().default(""),
  order: z.number().int().nonnegative().default(0),
  translations: UsesItemTranslationMapSchema,
});

const settingsInput = z.object({
  workspaceImage: z.string().optional().default(""),
  codingPreviewLight: z.string().optional().default(""),
  codingPreviewDark: z.string().optional().default(""),
  translations: z.record(
    z.string(),
    z.object({
      codingIntro: z.string().optional().default(""),
      browserIntro: z.string().optional().default(""),
    }),
  ),
  clarifications: z
    .array(
      z.object({
        id: z.string().optional(),
        order: z.number().int().nonnegative().default(0),
        translations: z.record(
          z.string(),
          z.object({
            body: z.string().optional().default(""),
          }),
        ),
      }),
    )
    .default([]),
});

const settingsInclude = {
  UsesSettingsTranslation: true,
  UsesClarification: {
    orderBy: { order: "asc" as const },
    include: { UsesClarificationTranslation: true },
  },
};

export const usesAdminRouter = createTRPCRouter({
  getMine: protectedProcedure
    .input(
      dataTableParamsSchema.extend({
        type: UsesItemTypeSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      let orderBy: Prisma.UsesItemOrderByWithRelationInput = { order: "asc" };
      if (input.sort && input.sort.length > 0) {
        const sortField = input.sort[0];
        if (sortField.id === "order") {
          orderBy = { order: sortField.desc ? "desc" : "asc" };
        }
      }

      const where: Prisma.UsesItemWhereInput = { userId: ctx.user.id };
      if (input.type) where.type = input.type;

      const titleVal = extractStringFilter(input.filters, "title");
      if (titleVal) {
        where.UsesItemTranslation = {
          some: { title: { contains: titleVal, mode: "insensitive" } },
        };
      }

      const [items, totalCount, languages] = await Promise.all([
        ctx.db.usesItem.findMany({
          where,
          include: { UsesItemTranslation: true },
          orderBy,
          skip,
          take,
        }),
        ctx.db.usesItem.count({ where }),
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ]);

      return {
        data: mapUsesItemsToEditorDto(items, languages),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  createItem: protectedProcedure
    .input(usesItemUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations, image, ...rest } = input;
      const translationRows = translationMapEntries(translations).map(
        (row) => ({
          appLanguageId: row.appLanguageId,
          title: row.title,
          description: row.description || null,
        }),
      );

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const created = await ctx.db.usesItem.create({
        data: {
          ...rest,
          image: image || null,
          userId: ctx.user.id,
          UsesItemTranslation: translationRows.length
            ? { createMany: { data: translationRows } }
            : undefined,
        },
        include: { UsesItemTranslation: true },
      });

      return mapUsesItemToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(usesItemUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations, image, ...data } = input;
      await assertOwner(
        await ctx.db.usesItem.findUnique({ where: { id } }),
        ctx.user.id,
      );

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      await ctx.db.usesItem.update({
        where: { id },
        data: { ...data, image: image || null },
      });

      for (const [appLanguageId, fields] of Object.entries(translations)) {
        const existing = await ctx.db.usesItemTranslation.findFirst({
          where: { usesItemId: id, appLanguageId },
        });
        if (existing) {
          await ctx.db.usesItemTranslation.update({
            where: { id: existing.id },
            data: {
              title: fields.title,
              description: fields.description || null,
            },
          });
        } else {
          await ctx.db.usesItemTranslation.create({
            data: {
              usesItemId: id,
              appLanguageId,
              title: fields.title,
              description: fields.description || null,
            },
          });
        }
      }

      const updated = await ctx.db.usesItem.findUniqueOrThrow({
        where: { id },
        include: { UsesItemTranslation: true },
      });

      return mapUsesItemToEditorDto(updated, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.usesItem.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );
      await ctx.db.usesItemTranslation.deleteMany({
        where: { usesItemId: input.id },
      });
      await ctx.db.usesItem.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const languages = await ctx.db.appLanguage.findMany({
      orderBy: { code: "asc" },
    });
    const existing = await ctx.db.usesSettings.findUnique({
      where: { userId: ctx.user.id },
      include: settingsInclude,
    });
    if (existing) return mapUsesSettingsToEditorDto(existing, languages);

    const created = await ctx.db.usesSettings.create({
      data: { userId: ctx.user.id },
      include: settingsInclude,
    });
    return mapUsesSettingsToEditorDto(created, languages);
  }),

  upsertSettings: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ ctx, input }) => {
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const settings = await ctx.db.usesSettings.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          workspaceImage: input.workspaceImage || null,
          codingPreviewLight: input.codingPreviewLight || null,
          codingPreviewDark: input.codingPreviewDark || null,
        },
        update: {
          workspaceImage: input.workspaceImage || null,
          codingPreviewLight: input.codingPreviewLight || null,
          codingPreviewDark: input.codingPreviewDark || null,
        },
      });

      for (const [appLanguageId, fields] of Object.entries(
        input.translations,
      )) {
        const existing = await ctx.db.usesSettingsTranslation.findFirst({
          where: { usesSettingsId: settings.id, appLanguageId },
        });
        const data = {
          codingIntro: fields.codingIntro ?? "",
          browserIntro: fields.browserIntro ?? "",
        };
        if (existing) {
          await ctx.db.usesSettingsTranslation.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await ctx.db.usesSettingsTranslation.create({
            data: {
              usesSettingsId: settings.id,
              appLanguageId,
              ...data,
            },
          });
        }
      }

      await ctx.db.usesClarificationTranslation.deleteMany({
        where: { UsesClarification: { usesSettingsId: settings.id } },
      });
      await ctx.db.usesClarification.deleteMany({
        where: { usesSettingsId: settings.id },
      });

      for (const [index, clarification] of input.clarifications.entries()) {
        const translationRows = translationMapEntries(
          clarification.translations,
        ).map((row) => ({
          appLanguageId: row.appLanguageId,
          body: row.body ?? "",
        }));

        await ctx.db.usesClarification.create({
          data: {
            usesSettingsId: settings.id,
            order: clarification.order ?? index,
            UsesClarificationTranslation: translationRows.length
              ? { createMany: { data: translationRows } }
              : undefined,
          },
        });
      }

      const refreshed = await ctx.db.usesSettings.findUniqueOrThrow({
        where: { id: settings.id },
        include: settingsInclude,
      });

      return mapUsesSettingsToEditorDto(refreshed, languages);
    }),

  emptyCreateDto: protectedProcedure
    .input(z.object({ type: UsesItemTypeSchema }))
    .query(async ({ ctx, input }) => {
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      return {
        initialData: buildEmptyUsesItemCreateDto(languages, input.type),
        languages,
      };
    }),
});
