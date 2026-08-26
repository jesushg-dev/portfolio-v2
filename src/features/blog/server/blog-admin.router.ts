import { z } from "zod";

import { extractStringFilter } from "@/lib/admin/filter-utils";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertOwner } from "@/lib/admin/portfolio-schemas";
import {
  mapBlogPostToEditorDto,
  mapBlogPostsToEditorDto,
} from "@/features/blog/lib/blog-editor-dto";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import { type Prisma } from "@prisma/client";

const BlogTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    excerpt: z.string().default(""),
    content: z.string().default(""),
  }),
);

const blogUpsertInput = z.object({
  slug: z.string().min(1),
  coverImage: z.string().default(""),
  tags: z.array(z.string()).default([]),
  seriesName: z.string().default(""),
  seriesOrder: z.number().int().nullable().default(null),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  publishedAt: z.string().nullable().default(null),
  translations: BlogTranslationMapSchema.default({}),
});

export const blogAdminRouter = createTRPCRouter({
  getMine: protectedProcedure
    .input(dataTableParamsSchema)
    .query(async ({ ctx, input }) => {
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      const where: Prisma.BlogPostWhereInput = { userId: ctx.user.id };

      const statusVal = extractStringFilter(input.filters, "status");
      if (statusVal) {
        where.status = statusVal as "DRAFT" | "PUBLISHED" | "ARCHIVED";
      }

      const titleVal = extractStringFilter(input.filters, "title");
      if (titleVal) {
        where.translations = {
          some: { title: { contains: titleVal, mode: "insensitive" } },
        };
      }

      const [posts, totalCount, languages] = await Promise.all([
        ctx.db.blogPost.findMany({
          where,
          include: { translations: true },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        ctx.db.blogPost.count({ where }),
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ]);

      return {
        data: mapBlogPostsToEditorDto(posts, languages),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [post, languages] = await Promise.all([
        ctx.db.blogPost.findUnique({
          where: { id: input.id },
          include: { translations: true },
        }),
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ]);

      if (post?.userId !== ctx.user.id) return null;
      return mapBlogPostToEditorDto(post, languages);
    }),

  createItem: protectedProcedure
    .input(blogUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations, publishedAt, ...rest } = input;
      const seriesName = rest.seriesName.trim();
      const tags = syncSeriesTag(rest.tags, seriesName);
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const translationRows = translationMapEntries(translations);

      const created = await ctx.db.blogPost.create({
        data: {
          ...rest,
          tags,
          seriesName: seriesName || null,
          userId: ctx.user.id,
          publishedAt:
            rest.status === "PUBLISHED"
              ? publishedAt
                ? new Date(publishedAt)
                : new Date()
              : null,
          translations: translationRows.length
            ? { createMany: { data: translationRows } }
            : undefined,
        },
        include: { translations: true },
      });

      return mapBlogPostToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(blogUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations, publishedAt, ...data } = input;
      const seriesName = data.seriesName.trim();
      const tags = syncSeriesTag(data.tags, seriesName);
      await assertOwner(
        await ctx.db.blogPost.findUnique({ where: { id } }),
        ctx.user.id,
      );

      await ctx.db.blogPost.update({
        where: { id },
        data: {
          ...data,
          tags,
          seriesName: seriesName || null,
          publishedAt:
            data.status === "PUBLISHED"
              ? publishedAt
                ? new Date(publishedAt)
                : new Date()
              : null,
        },
      });

      for (const translation of translationMapEntries(translations)) {
        const existing = await ctx.db.blogPostTranslation.findFirst({
          where: { postId: id, appLanguageId: translation.appLanguageId },
        });
        if (existing) {
          await ctx.db.blogPostTranslation.update({
            where: { id: existing.id },
            data: {
              title: translation.title,
              excerpt: translation.excerpt ?? "",
              content: translation.content ?? "",
            },
          });
        } else {
          await ctx.db.blogPostTranslation.create({
            data: { postId: id, ...translation },
          });
        }
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const updated = await ctx.db.blogPost.findUnique({
        where: { id },
        include: { translations: true },
      });

      return mapBlogPostToEditorDto(updated!, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.blogPost.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );

      return ctx.db.$transaction(async (tx) => {
        await tx.blogPostTranslation.deleteMany({
          where: { postId: input.id },
        });
        return tx.blogPost.delete({ where: { id: input.id } });
      });
    }),

  moveInSeries: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        direction: z.enum(["up", "down"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.blogPost.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true, seriesName: true },
      });

      await assertOwner(current, ctx.user.id);
      if (!current?.seriesName) return { moved: false };

      const siblings = await ctx.db.blogPost.findMany({
        where: {
          userId: ctx.user.id,
          seriesName: current.seriesName,
        },
        select: { id: true, seriesOrder: true, publishedAt: true, createdAt: true },
      });

      const sorted = siblings
        .slice()
        .sort((a, b) => {
          const aOrder = a.seriesOrder ?? Number.MAX_SAFE_INTEGER;
          const bOrder = b.seriesOrder ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;
          const aDate = a.publishedAt?.getTime() ?? a.createdAt.getTime();
          const bDate = b.publishedAt?.getTime() ?? b.createdAt.getTime();
          return aDate - bDate;
        })
        .map((post, index) => ({ ...post, normalizedOrder: index + 1 }));

      const currentIndex = sorted.findIndex((post) => post.id === input.id);
      if (currentIndex === -1) return { moved: false };

      const targetIndex =
        input.direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return { moved: false };

      const reordered = sorted.slice();
      const temp = reordered[currentIndex];
      reordered[currentIndex] = reordered[targetIndex];
      reordered[targetIndex] = temp;

      await ctx.db.$transaction(
        reordered.map((post, index) =>
          ctx.db.blogPost.update({
            where: { id: post.id },
            data: { seriesOrder: index + 1 },
          }),
        ),
      );

      return { moved: true };
    }),
});

function syncSeriesTag(tags: string[], seriesName: string) {
  const cleaned = tags.filter(
    (tag) => !tag.toLowerCase().startsWith("series:"),
  );
  if (!seriesName) return cleaned;
  return [...cleaned, `series:${seriesName}`];
}
