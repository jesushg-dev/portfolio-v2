import { z } from "zod";

import {
  getPublishedProcessPageBySlug,
  pickProcessPageTranslation,
} from "@/features/process-pages/server/process-pages-public";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const localeSchema = z.enum(["es", "en", "nl"]);

export const processPagesRouter = createTRPCRouter({
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        locale: localeSchema.optional().default("en"),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getPublishedProcessPageBySlug(
        ctx.db,
        ctx.tenant?.userId ?? null,
        input.slug,
        input.locale,
      );
    }),

  listForNav: publicProcedure
    .input(
      z.object({
        locale: localeSchema.optional().default("en"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantUserId = ctx.tenant?.userId ?? null;
      if (!tenantUserId) return [];

      const [languages, pages] = await Promise.all([
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
        ctx.db.processPage.findMany({
          where: {
            userId: tenantUserId,
            isPublished: true,
            showInNav: true,
          },
          include: { ProcessPageTranslation: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        }),
      ]);

      return pages.map((page) => {
        const translation = pickProcessPageTranslation(
          page.ProcessPageTranslation,
          languages,
          input.locale,
        );
        return {
          id: page.id,
          slug: page.slug,
          template: page.template,
          navIcon: page.navIcon,
          order: page.order,
          menuTitle: translation?.menuTitle ?? "",
          navDescription: translation?.navDescription ?? "",
        };
      });
    }),
});
