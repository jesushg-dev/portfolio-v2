import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { extractWords } from "@/features/blog/lib/blog-headings";

const LanguageCode = z.enum(["es", "en", "nl"]);

function pickLocalized<T extends { language?: { code: string } | null }>(
  items: T[] | undefined | null,
  locale?: string,
): T | undefined {
  if (!items || items.length === 0) return undefined;
  return (
    items.find((item) => item.language?.code === locale) ??
    items.find((item) => item.language?.code === "en") ??
    items.find((item) => item.language?.code === "es") ??
    items[0]
  );
}

export const blogPublicRouter = createTRPCRouter({
  getTags: publicProcedure
    .input(
      z.object({
        seriesSlug: z.string().optional(),
        seriesName: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.tenant?.userId) return [];
      const seriesFilter = input.seriesSlug ?? input.seriesName;
      const posts = await ctx.db.blogPost.findMany({
        where: {
          userId: ctx.tenant.userId,
          status: "PUBLISHED",
          ...(seriesFilter
            ? {
                OR: [
                  { series: { slug: seriesFilter } },
                  {
                    series: {
                      translations: { some: { title: seriesFilter } },
                    },
                  },
                ],
              }
            : {}),
        },
        select: { tags: true },
      });
      return [...new Set(posts.flatMap((post) => post.tags))]
        .filter(
          (tag) =>
            !tag.toLowerCase().startsWith("series:") &&
            !tag.toLowerCase().startsWith("archivo-"),
        )
        .sort((a, b) => a.localeCompare(b));
    }),

  getTagCounts: publicProcedure
    .input(
      z.object({
        seriesSlug: z.string().optional(),
        seriesName: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.tenant?.userId) return [];
      const seriesFilter = input.seriesSlug ?? input.seriesName;
      const posts = await ctx.db.blogPost.findMany({
        where: {
          userId: ctx.tenant.userId,
          status: "PUBLISHED",
          ...(seriesFilter
            ? {
                OR: [
                  { series: { slug: seriesFilter } },
                  {
                    series: {
                      translations: { some: { title: seriesFilter } },
                    },
                  },
                ],
              }
            : {}),
        },
        select: { tags: true },
      });
      const counts: Record<string, number> = {};
      posts.forEach((post) => {
        post.tags.forEach((tag) => {
          if (
            !tag.toLowerCase().startsWith("series:") &&
            !tag.toLowerCase().startsWith("archivo-")
          ) {
            counts[tag] = (counts[tag] || 0) + 1;
          }
        });
      });
      return Object.entries(counts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    }),

  getSeries: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return [];

      const seriesList = await ctx.db.blogSeries.findMany({
        where: { userId: tenantUserId },
        include: {
          translations: {
            include: { language: { select: { code: true } } },
          },
          posts: {
            where: { status: "PUBLISHED" },
            select: {
              publishedAt: true,
              translations: {
                include: { language: { select: { code: true } } },
              },
            },
          },
        },
      });

      return seriesList
        .map((series) => {
          const trans = pickLocalized(series.translations, input.locale);
          const publishedDates = series.posts
            .map((p) => p.publishedAt?.toISOString() ?? null)
            .filter(Boolean) as string[];
          const latestPublishedAt =
            publishedDates.slice().sort().reverse()[0] ?? null;
          const sampleTrans = pickLocalized(
            series.posts[0]?.translations,
            input.locale,
          );
          const sampleTitle = sampleTrans?.title ?? "";

          return {
            id: series.id,
            slug: series.slug,
            name: trans?.title ?? series.slug,
            description: trans?.description ?? null,
            coverImage: series.coverImage ?? null,
            count: series.posts.length,
            latestPublishedAt,
            sampleTitle,
          };
        })
        .filter((s) => s.count > 0)
        .sort((a, b) => {
          const aDate = a.latestPublishedAt
            ? Date.parse(a.latestPublishedAt)
            : 0;
          const bDate = b.latestPublishedAt
            ? Date.parse(b.latestPublishedAt)
            : 0;
          return bDate - aDate;
        });
    }),

  getSeriesBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return null;

      const series = await ctx.db.blogSeries.findFirst({
        where: {
          userId: tenantUserId,
          OR: [
            { slug: input.slug },
            { translations: { some: { title: input.slug } } },
          ],
        },
        include: {
          translations: {
            include: { language: { select: { code: true } } },
          },
          posts: {
            where: { status: "PUBLISHED" },
            select: { id: true },
          },
        },
      });

      if (!series) return null;

      const trans = pickLocalized(series.translations, input.locale);
      return {
        id: series.id,
        slug: series.slug,
        title: trans?.title ?? series.slug,
        description: trans?.description ?? null,
        coverImage: series.coverImage ?? null,
        count: series.posts.length,
      };
    }),

  list: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        tag: z.string().optional(),
        seriesSlug: z.string().optional(),
        seriesName: z.string().optional(),
        search: z.string().trim().max(200).optional(),
        sort: z.enum(["new", "old", "part"]).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return { posts: [], nextCursor: null, total: 0 };

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const seriesFilter = input.seriesSlug ?? input.seriesName;

      const where = {
        userId: tenantUserId,
        status: "PUBLISHED" as const,
        ...(input.tag ? { tags: { has: input.tag } } : {}),
        ...(seriesFilter
          ? {
              OR: [
                { series: { slug: seriesFilter } },
                {
                  series: {
                    translations: { some: { title: seriesFilter } },
                  },
                },
                { tags: { has: `series:${seriesFilter}` } },
              ],
            }
          : {}),
        ...(input.search
          ? {
              OR: [
                { tags: { has: input.search } },
                {
                  translations: {
                    some: {
                      ...(appLanguage ? { appLanguageId: appLanguage.id } : {}),
                      OR: [
                        {
                          title: {
                            contains: input.search,
                            mode: "insensitive" as const,
                          },
                        },
                        {
                          excerpt: {
                            contains: input.search,
                            mode: "insensitive" as const,
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      };

      const orderBy =
        input.sort === "part" || (!input.sort && seriesFilter)
          ? [
              { seriesOrder: "asc" as const },
              { publishedAt: "asc" as const },
              { id: "asc" as const },
            ]
          : input.sort === "old"
            ? [{ publishedAt: "asc" as const }, { id: "asc" as const }]
            : [{ publishedAt: "desc" as const }, { id: "desc" as const }];

      const [total, posts] = await Promise.all([
        ctx.db.blogPost.count({ where }),
        ctx.db.blogPost.findMany({
          where,
          include: {
            series: {
              include: {
                translations: {
                  include: { language: { select: { code: true } } },
                },
              },
            },
            translations: {
              include: { language: { select: { code: true } } },
            },
          },
          orderBy,
          ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
          take: input.limit + 1,
        }),
      ]);

      let nextCursor: string | null = null;
      if (posts.length > input.limit) {
        posts.pop();
        nextCursor = posts.at(-1)?.id ?? null;
      }

      const mapped = posts.map((post) => {
        const t = pickLocalized(post.translations, input.locale);
        const seriesTrans = pickLocalized(
          post.series?.translations,
          input.locale,
        );
        const words = extractWords(t?.content ?? "");
        const readingTime = Math.max(1, Math.ceil(words / 220));
        return {
          id: post.id,
          slug: post.slug,
          coverImage: post.coverImage,
          tags: post.tags,
          seriesId: post.seriesId ?? null,
          seriesSlug: post.series?.slug ?? null,
          seriesName: seriesTrans?.title ?? post.series?.slug ?? null,
          seriesOrder: post.seriesOrder ?? null,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          title: t?.title ?? "",
          excerpt: t?.excerpt ?? "",
          readingTime,
        };
      });

      return { posts: mapped, nextCursor, total };
    }),

  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return null;

      const post = await ctx.db.blogPost.findFirst({
        where: {
          userId: tenantUserId,
          slug: input.slug,
          status: "PUBLISHED",
        },
        include: {
          series: {
            include: {
              translations: {
                include: { language: { select: { code: true } } },
              },
            },
          },
          translations: {
            include: { language: { select: { code: true } } },
          },
        },
      });

      if (!post) return null;

      const t = pickLocalized(post.translations, input.locale);
      const seriesTrans = pickLocalized(
        post.series?.translations,
        input.locale,
      );

      return {
        id: post.id,
        slug: post.slug,
        coverImage: post.coverImage,
        tags: post.tags,
        seriesId: post.seriesId ?? null,
        seriesSlug: post.series?.slug ?? null,
        seriesName: seriesTrans?.title ?? post.series?.slug ?? null,
        seriesDescription: seriesTrans?.description ?? null,
        seriesOrder: post.seriesOrder ?? null,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        title: t?.title ?? "",
        excerpt: t?.excerpt ?? "",
        content: t?.content ?? "",
      };
    }),
});
