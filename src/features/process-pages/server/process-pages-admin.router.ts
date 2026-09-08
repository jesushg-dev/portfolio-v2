import {
  Prisma,
  type PrismaClient,
  type ProcessPageTemplate,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { extractStringFilter } from "@/lib/admin/filter-utils";
import { assertOwner } from "@/features/portfolio/server/portfolio-admin-shared";
import {
  buildEmptyProcessPageCreateDto,
  emptyProcessPageTranslationFields,
  mapProcessPageToEditorDto,
  mapProcessPagesToEditorDto,
} from "@/features/process-pages/lib/process-page-editor-dto";
import {
  flattenProcessPageCopy,
  parseProcessPageContent,
  processPageIconSchema,
  processPageSlugSchema,
  processPageTemplateSchema,
} from "@/features/process-pages/lib/process-page-content";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const ProcessPageTranslationMapSchema = z.record(
  z.string(),
  z.object({
    metaTitle: z.string().optional().default(""),
    metaDescription: z.string().optional().default(""),
    menuTitle: z.string().optional().default(""),
    navDescription: z.string().optional().default(""),
    pageNavLabel: z.string().optional().default(""),
    heroEyebrow: z.string().optional().default(""),
    heroTitle: z.string().optional().default(""),
    heroTitleHighlight: z.string().optional().default(""),
    heroDescription: z.string().optional().default(""),
    heroPrimaryCta: z.string().optional().default(""),
    heroSecondaryCta: z.string().optional().default(""),
    heroScrollHint: z.string().optional().default(""),
    ctaTitle: z.string().optional().default(""),
    ctaDescription: z.string().optional().default(""),
    ctaButton: z.string().optional().default(""),
  }),
);

const processPageUpsertInput = z.object({
  slug: processPageSlugSchema,
  template: processPageTemplateSchema.default("WORKFLOW"),
  isPublished: z.boolean().default(false),
  showInNav: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
  navIcon: processPageIconSchema.default("Bot"),
  translations: ProcessPageTranslationMapSchema.default({}),
  contentByLanguage: z.record(z.string(), z.unknown()).default({}),
});

const pageInclude = { ProcessPageTranslation: true } as const;

async function assertUniqueSlug(
  db: PrismaClient,
  userId: string,
  slug: string,
  excludeId?: string,
) {
  const existing = await db.processPage.findFirst({
    where: {
      userId,
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A process page with this slug already exists.",
    });
  }
}

function translationCreateRows(
  languages: { id: string }[],
  translations: z.infer<typeof ProcessPageTranslationMapSchema>,
  contentByLanguage: Record<string, unknown>,
  template?: ProcessPageTemplate,
) {
  return languages.map((language) => {
    const content = parseProcessPageContent(
      contentByLanguage[language.id],
      template,
    );
    const copy = flattenProcessPageCopy(content);
    const fields = {
      ...emptyProcessPageTranslationFields,
      ...translations[language.id],
      ...copy,
    };
    return {
      appLanguageId: language.id,
      metaTitle: fields.metaTitle,
      metaDescription: fields.metaDescription,
      menuTitle: fields.menuTitle,
      navDescription: fields.navDescription,
      pageNavLabel: fields.pageNavLabel,
      heroEyebrow: fields.heroEyebrow,
      heroTitle: fields.heroTitle,
      heroTitleHighlight: fields.heroTitleHighlight,
      heroDescription: fields.heroDescription,
      heroPrimaryCta: fields.heroPrimaryCta,
      heroSecondaryCta: fields.heroSecondaryCta,
      heroScrollHint: fields.heroScrollHint,
      ctaTitle: fields.ctaTitle,
      ctaDescription: fields.ctaDescription,
      ctaButton: fields.ctaButton,
      content: content,
    };
  });
}

export const processPagesAdminRouter = createTRPCRouter({
  getMine: protectedProcedure
    .input(
      dataTableParamsSchema.extend({
        template: processPageTemplateSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      let orderBy: Prisma.ProcessPageOrderByWithRelationInput = {
        order: "asc",
      };
      if (input.sort && input.sort.length > 0) {
        const sortField = input.sort[0];
        if (sortField.id === "order") {
          orderBy = { order: sortField.desc ? "desc" : "asc" };
        } else if (sortField.id === "slug") {
          orderBy = { slug: sortField.desc ? "desc" : "asc" };
        }
      }

      const where: Prisma.ProcessPageWhereInput = {
        userId: ctx.user.id,
      };
      if (input.template) where.template = input.template;

      const titleVal = extractStringFilter(input.filters, "title");
      if (titleVal) {
        where.ProcessPageTranslation = {
          some: { menuTitle: { contains: titleVal, mode: "insensitive" } },
        };
      }

      const slugVal = extractStringFilter(input.filters, "slug");
      if (slugVal) {
        where.slug = { contains: slugVal, mode: "insensitive" };
      }

      const [pages, totalCount, languages] = await Promise.all([
        ctx.db.processPage.findMany({
          where,
          include: pageInclude,
          orderBy,
          skip,
          take,
        }),
        ctx.db.processPage.count({ where }),
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ]);

      return {
        data: mapProcessPagesToEditorDto(pages, languages),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const page = await ctx.db.processPage.findUnique({
        where: { id: input.id },
        include: pageInclude,
      });
      if (!page) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await assertOwner(page, ctx.user.id);
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      return mapProcessPageToEditorDto(page, languages);
    }),

  createItem: protectedProcedure
    .input(processPageUpsertInput)
    .mutation(async ({ ctx, input }) => {
      await assertUniqueSlug(ctx.db, ctx.user.id, input.slug);

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const translationRows = translationCreateRows(
        languages,
        input.translations,
        input.contentByLanguage,
        input.template,
      );

      const created = await ctx.db.processPage.create({
        data: {
          userId: ctx.user.id,
          slug: input.slug,
          template: input.template,
          isPublished: input.isPublished,
          showInNav: input.showInNav,
          order: input.order,
          navIcon: input.navIcon,
          ProcessPageTranslation: translationRows.length
            ? { createMany: { data: translationRows } }
            : undefined,
        },
        include: pageInclude,
      });

      return mapProcessPageToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(processPageUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations, contentByLanguage, ...data } = input;
      await assertOwner(
        await ctx.db.processPage.findUnique({ where: { id } }),
        ctx.user.id,
      );
      await assertUniqueSlug(ctx.db, ctx.user.id, data.slug, id);

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      await ctx.db.processPage.update({
        where: { id },
        data: {
          slug: data.slug,
          template: data.template,
          isPublished: data.isPublished,
          showInNav: data.showInNav,
          order: data.order,
          navIcon: data.navIcon,
        },
      });

      for (const row of translationCreateRows(
        languages,
        translations,
        contentByLanguage,
        data.template,
      )) {
        const existing = await ctx.db.processPageTranslation.findFirst({
          where: { processPageId: id, appLanguageId: row.appLanguageId },
        });
        const { appLanguageId, ...fields } = row;
        if (existing) {
          await ctx.db.processPageTranslation.update({
            where: { id: existing.id },
            data: fields,
          });
        } else {
          await ctx.db.processPageTranslation.create({
            data: {
              processPageId: id,
              appLanguageId,
              ...fields,
            },
          });
        }
      }

      const updated = await ctx.db.processPage.findUniqueOrThrow({
        where: { id },
        include: pageInclude,
      });

      return mapProcessPageToEditorDto(updated, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.processPage.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );
      await ctx.db.processPageTranslation.deleteMany({
        where: { processPageId: input.id },
      });
      await ctx.db.processPage.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  emptyCreateDto: protectedProcedure.query(async ({ ctx }) => {
    const languages = await ctx.db.appLanguage.findMany({
      orderBy: { code: "asc" },
    });
    return {
      initialData: buildEmptyProcessPageCreateDto(languages),
      languages,
    };
  }),
});
