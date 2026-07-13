import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  extractArrayFilter,
  extractStringFilter,
} from "@/lib/admin/filter-utils";
import {
  buildLocalizedJsonTitleMongoMatch,
  escapeMongoRegex,
  mongoUserIdFilter,
  queryPaginatedIdsWithMongoMatch,
  reorderByIds,
  type MongoSort,
} from "@/lib/admin/mongodb-localized-json-query";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  mapTimelinesToEditorDto,
  mapTimelineToEditorDto,
} from "@/features/timeline/lib/timeline-editor-dto";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import { translationMapToLocalizedFields } from "@/lib/i18n/localized-persist";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import type { Prisma, TimelineCategory } from "@prisma/client";

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

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      if (titleVal) {
        const mongoMatch: Record<string, unknown> = {
          userId: mongoUserIdFilter(ctx.user.id),
        };
        if (orgVal) {
          mongoMatch.organization = {
            $regex: escapeMongoRegex(orgVal),
            $options: "i",
          };
        }
        if (categoryVals && categoryVals.length > 0) {
          mongoMatch.category = { $in: categoryVals };
        }
        Object.assign(
          mongoMatch,
          buildLocalizedJsonTitleMongoMatch("title", titleVal),
        );

        const sortField = input.sort?.[0];
        let mongoSort: MongoSort = { startDate: -1, createdAt: -1 };
        if (sortField) {
          const dir: 1 | -1 = sortField.desc ? -1 : 1;
          if (sortField.id === "category") mongoSort = { category: dir };
          else if (sortField.id === "startDate") mongoSort = { startDate: dir };
          else if (sortField.id === "organization") {
            mongoSort = { organization: dir };
          }
        }

        const { ids, totalCount } = await queryPaginatedIdsWithMongoMatch({
          delegate: ctx.db.timelineItem,
          match: mongoMatch,
          sort: mongoSort,
          skip,
          take,
        });

        const items =
          ids.length > 0
            ? reorderByIds(
                await ctx.db.timelineItem.findMany({
                  where: { id: { in: ids } },
                }),
                ids,
              )
            : [];

        return {
          data: mapTimelinesToEditorDto(items, languages),
          pageCount: take ? Math.ceil(totalCount / take) : 1,
          totalCount,
        };
      }

      const [items, totalCount] = await Promise.all([
        ctx.db.timelineItem.findMany({
          where,
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
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const primaryLanguage = resolvePrimaryLanguage(languages);
      const primaryCode = primaryLanguage?.code ?? "en";
      const { translations, images, ...rest } = input;
      const { title, description } = translationMapToLocalizedFields(
        translations,
        languages,
        primaryCode,
      );

      const created = await ctx.db.timelineItem.create({
        data: {
          ...rest,
          title,
          description,
          images: images ?? [],
          userId: ctx.user.id,
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

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const primaryLanguage = resolvePrimaryLanguage(languages);
      const primaryCode = primaryLanguage?.code ?? "en";
      const { title, description } = translationMapToLocalizedFields(
        translations,
        languages,
        primaryCode,
      );

      const updated = await ctx.db.timelineItem.update({
        where: { id },
        data: {
          ...data,
          title,
          description,
          ...(images !== undefined ? { images } : {}),
        },
      });

      return mapTimelineToEditorDto(updated, languages);
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

      return ctx.db.timelineItem.delete({ where: { id: input.id } });
    }),
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.timelineItem.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };
    return ctx.db.timelineItem.deleteMany({ where: { id: { in: ids } } });
  }),
});
