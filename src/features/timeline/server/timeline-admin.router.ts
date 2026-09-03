import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  extractArrayFilter,
  extractStringFilter,
} from "@/lib/admin/filter-utils";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  mapTimelinesToEditorDto,
  mapTimelineToEditorDto,
} from "@/features/timeline/lib/timeline-editor-dto";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import type { Prisma, TimelineCategory } from "@prisma/client";
import { normalizeEmploymentDates } from "@/utils/tools/date";

const TimelineCategorySchema = z.enum(["WORK", "STUDY", "COURSE"]);

const TimelineTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
  }),
);

const timelineUpsertInput = z.object({
  organization: z.string().min(1),
  location: z.string().optional(),
  category: TimelineCategorySchema,
  startDate: z.date(),
  endDate: z.date().optional(),
  current: z.boolean().default(false),
  images: z.array(z.string().url()).optional(),
  translations: TimelineTranslationMapSchema,
});

export const timelineAdminRouter = createTRPCRouter({
  getMine: protectedProcedure
    .input(dataTableParamsSchema)
    .query(async ({ ctx, input }) => {
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      let orderBy:
        | Prisma.TimelineItemOrderByWithRelationInput
        | Prisma.TimelineItemOrderByWithRelationInput[] = [
        { startDate: "desc" },
        { createdAt: "desc" },
      ];
      if (input.sort && input.sort.length > 0) {
        const sortField = input.sort[0];
        if (sortField.id === "category")
          orderBy = { category: sortField.desc ? "desc" : "asc" };
        if (sortField.id === "startDate")
          orderBy = { startDate: sortField.desc ? "desc" : "asc" };
        if (sortField.id === "organization")
          orderBy = { organization: sortField.desc ? "desc" : "asc" };
      }

      const where: Prisma.TimelineItemWhereInput = { userId: ctx.user.id };
      const orgVal = extractStringFilter(input.filters, "organization");
      if (orgVal) {
        where.organization = { contains: orgVal, mode: "insensitive" };
      }

      const categoryVals = extractArrayFilter<TimelineCategory>(
        input.filters,
        "category",
      );
      if (categoryVals && categoryVals.length > 0) {
        where.category = { in: categoryVals };
      }

      const titleVal = extractStringFilter(input.filters, "title");
      if (titleVal) {
        where.TimelineItemTranslation = {
          some: {
            title: { contains: titleVal, mode: "insensitive" },
          },
        };
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const [items, totalCount] = await Promise.all([
        ctx.db.timelineItem.findMany({
          where,
          include: {
            TimelineItemTranslation: true,
          },
          orderBy,
          skip,
          take,
        }),
        ctx.db.timelineItem.count({ where }),
      ]);

      return {
        data: mapTimelinesToEditorDto(items, languages),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  createItem: protectedProcedure
    .input(timelineUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations, images, ...rest } = input;
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const created = await ctx.db.timelineItem.create({
        data: {
          ...rest,
          ...normalizeEmploymentDates(rest),
          images: images ?? [],
          userId: ctx.user.id,
          TimelineItemTranslation: {
            create: translationMapEntries(translations).map((translation) => ({
              appLanguageId: translation.appLanguageId,
              title: translation.title,
              description: translation.description,
            })),
          },
        },
        include: {
          TimelineItemTranslation: true,
        },
      });

      return mapTimelineToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(timelineUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations, images, ...data } = input;
      const existing = await ctx.db.timelineItem.findUnique({ where: { id } });

      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.timelineItem.update({
        where: { id },
        data: {
          ...data,
          ...normalizeEmploymentDates(data),
          ...(images !== undefined ? { images } : {}),
        },
      });

      for (const translation of translationMapEntries(translations)) {
        const existingTrans = await ctx.db.timelineItemTranslation.findFirst({
          where: {
            timelineItemId: id,
            appLanguageId: translation.appLanguageId,
          },
        });

        if (existingTrans) {
          await ctx.db.timelineItemTranslation.update({
            where: { id: existingTrans.id },
            data: {
              title: translation.title,
              description: translation.description,
            },
          });
        } else {
          await ctx.db.timelineItemTranslation.create({
            data: {
              timelineItemId: id,
              appLanguageId: translation.appLanguageId,
              title: translation.title,
              description: translation.description,
            },
          });
        }
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const updated = await ctx.db.timelineItem.findUnique({
        where: { id },
        include: {
          TimelineItemTranslation: true,
        },
      });

      return mapTimelineToEditorDto(updated!, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.timelineItem.findUnique({
        where: { id: input.id },
      });

      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.timelineItemTranslation.deleteMany({
        where: { timelineItemId: input.id },
      });

      return ctx.db.timelineItem.delete({ where: { id: input.id } });
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.timelineItem.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };
    await ctx.db.timelineItemTranslation.deleteMany({
      where: { timelineItemId: { in: ids } },
    });
    return ctx.db.timelineItem.deleteMany({ where: { id: { in: ids } } });
  }),
});
