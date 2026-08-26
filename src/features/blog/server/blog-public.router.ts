import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const LanguageCode = z.enum(["es", "en", "nl"]);

export const blogPublicRouter = createTRPCRouter({
  getSeries: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return [];

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const posts = await ctx.db.blogPost.findMany({
        where: {
          userId: tenantUserId,
          status: "PUBLISHED",
        },
        select: {
          tags: true,
          seriesName: true,
          seriesOrder: true,
          publishedAt: true,
          translations: {
            where: appLanguage ? { appLanguageId: appLanguage.id } : undefined,
            select: { title: true },
          },
        },
      });

      const bySeries = new Map<
        string,
        { name: string; count: number; latestPublishedAt: string | null; sampleTitle: string }
      >();

      posts.forEach((post) => {
        const sampleTitle = post.translations[0]?.title ?? "";
        const tagDerived = post.tags
          .filter((tag) => tag.toLowerCase().startsWith("series:"))
          .map((tag) => tag.replace(/^series:/i, "").trim())
          .filter(Boolean);
        const seriesNames = post.seriesName ? [post.seriesName, ...tagDerived] : tagDerived;

        seriesNames.forEach((name) => {
          const current = bySeries.get(name);
          const publishedAt = post.publishedAt?.toISOString() ?? null;
          if (!current) {
            bySeries.set(name, {
              name,
              count: 1,
              latestPublishedAt: publishedAt,
              sampleTitle,
            });
            return;
          }
          const latest =
            current.latestPublishedAt && publishedAt
              ? current.latestPublishedAt > publishedAt
                ? current.latestPublishedAt
                : publishedAt
              : current.latestPublishedAt ?? publishedAt;
          bySeries.set(name, {
            ...current,
            count: current.count + 1,
            latestPublishedAt: latest,
          });
        });
      });

      return Array.from(bySeries.values()).sort((a, b) => {
        const aDate = a.latestPublishedAt ? Date.parse(a.latestPublishedAt) : 0;
        const bDate = b.latestPublishedAt ? Date.parse(b.latestPublishedAt) : 0;
        return bDate - aDate;
      });
    }),

  list: publicProcedure
    .input(
      z.object({
        locale: LanguageCode.optional().default("en"),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        tag: z.string().optional(),
        seriesName: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return { posts: [], nextCursor: null };

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const where = {
        userId: tenantUserId,
        status: "PUBLISHED" as const,
        ...(input.tag ? { tags: { has: input.tag } } : {}),
        ...(input.seriesName ? { seriesName: input.seriesName } : {}),
        ...(input.cursor ? { id: { lt: input.cursor } } : {}),
      };

      const posts = await ctx.db.blogPost.findMany({
        where,
        include: {
          translations: {
            where: appLanguage ? { appLanguageId: appLanguage.id } : undefined,
          },
        },
        orderBy: input.seriesName
          ? [{ seriesOrder: "asc" }, { publishedAt: "asc" }]
          : { publishedAt: "desc" },
        take: input.limit + 1,
      });

      let nextCursor: string | null = null;
      if (posts.length > input.limit) {
        const next = posts.pop()!;
        nextCursor = next.id;
      }

      const mapped = posts.map((post) => {
        const t = post.translations[0];
        return {
          id: post.id,
          slug: post.slug,
          coverImage: post.coverImage,
          tags: post.tags,
          seriesName: post.seriesName ?? null,
          seriesOrder: post.seriesOrder ?? null,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          title: t?.title ?? "",
          excerpt: t?.excerpt ?? "",
        };
      });

      return { posts: mapped, nextCursor };
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

      const appLanguage = await ctx.db.appLanguage.findUnique({
        where: { code: input.locale },
      });

      const post = await ctx.db.blogPost.findFirst({
        where: {
          userId: tenantUserId,
          slug: input.slug,
          status: "PUBLISHED",
        },
        include: {
          translations: {
            where: appLanguage ? { appLanguageId: appLanguage.id } : undefined,
          },
        },
      });

      if (!post) return null;

      const t = post.translations[0];
      return {
        id: post.id,
        slug: post.slug,
        coverImage: post.coverImage,
        tags: post.tags,
        seriesName: post.seriesName ?? null,
        seriesOrder: post.seriesOrder ?? null,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        title: t?.title ?? "",
        excerpt: t?.excerpt ?? "",
        content: t?.content ?? "",
      };
    }),
});
