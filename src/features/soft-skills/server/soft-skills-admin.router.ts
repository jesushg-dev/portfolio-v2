import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { extractStringFilter } from "@/lib/admin/filter-utils";
import {
  buildLocalizedJsonTitleMongoMatch,
  mongoUserIdFilter,
  queryPaginatedIdsWithMongoMatch,
  reorderByIds,
  type MongoSort,
} from "@/lib/admin/mongodb-localized-json-query";
import { type PrismaClient, type Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  DEFAULT_SOFT_SKILLS_POSTER_URL,
  DEFAULT_SOFT_SKILLS_VIDEO_URL,
} from "@/features/soft-skills/lib/soft-skills-media";
import { isSoftSkillIconKey } from "@/features/soft-skills/lib/soft-skill-icons";
import {
  mapSoftSkillToEditorDto,
  mapSoftSkillsToEditorDto,
} from "@/features/soft-skills/lib/soft-skill-editor-dto";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import { translationMapToLocalizedFields } from "@/lib/i18n/localized-persist";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";

const SoftSkillsMediaTypeSchema = z.enum(["VIDEO", "IMAGE"]);

const SoftSkillTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
  }),
);

const softSkillUpsertInput = z.object({
  icon: z.string().min(1).refine(isSoftSkillIconKey, {
    message: "Invalid icon key",
  }),
  isVisible: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
  translations: SoftSkillTranslationMapSchema,
});

const sectionInput = z.object({
  mediaType: SoftSkillsMediaTypeSchema,
  videoUrl: z.string().url().or(z.literal("")).optional(),
  posterUrl: z.string().url().or(z.literal("")).optional(),
  imageUrl: z.string().url().or(z.literal("")).optional(),
});

async function ensureSection(userId: string, db: PrismaClient) {
  const existing = await db.softSkillsSection.findUnique({ where: { userId } });
  if (existing) return existing;

  return db.softSkillsSection.create({
    data: {
      userId,
      mediaType: "VIDEO",
      videoUrl: DEFAULT_SOFT_SKILLS_VIDEO_URL,
      posterUrl: DEFAULT_SOFT_SKILLS_POSTER_URL,
    },
  });
}

export const softSkillsAdminRouter = createTRPCRouter({
  getMine: protectedProcedure
    .input(dataTableParamsSchema)
    .query(async ({ ctx, input }) => {
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      let orderBy:
        | Prisma.PortfolioSoftSkillOrderByWithRelationInput
        | Prisma.PortfolioSoftSkillOrderByWithRelationInput[] = [
        { order: "asc" },
        { createdAt: "asc" },
      ];
      if (input.sort && input.sort.length > 0) {
        const sortField = input.sort[0];
        if (sortField.id === "order")
          orderBy = { order: sortField.desc ? "desc" : "asc" };
      }

      const where: Prisma.PortfolioSoftSkillWhereInput = {
        userId: ctx.user.id,
      };

      const titleVal = extractStringFilter(input.filters, "title");

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      if (titleVal) {
        const mongoMatch: Record<string, unknown> = {
          userId: mongoUserIdFilter(ctx.user.id),
          ...buildLocalizedJsonTitleMongoMatch("title", titleVal),
        };

        const sortField = input.sort?.[0];
        let mongoSort: MongoSort = { order: 1, createdAt: 1 };
        if (sortField?.id === "order") {
          const dir: 1 | -1 = sortField.desc ? -1 : 1;
          mongoSort = { order: dir, createdAt: dir };
        }

        const { ids, totalCount } = await queryPaginatedIdsWithMongoMatch({
          delegate: ctx.db.portfolioSoftSkill,
          match: mongoMatch,
          sort: mongoSort,
          skip,
          take,
        });

        const items =
          ids.length > 0
            ? reorderByIds(
                await ctx.db.portfolioSoftSkill.findMany({
                  where: { id: { in: ids } },
                }),
                ids,
              )
            : [];

        return {
          data: mapSoftSkillsToEditorDto(items, languages),
          pageCount: take ? Math.ceil(totalCount / take) : 1,
          totalCount,
        };
      }

      const [items, totalCount] = await Promise.all([
        ctx.db.portfolioSoftSkill.findMany({
          where,
          orderBy,
          skip,
          take,
        }),
        ctx.db.portfolioSoftSkill.count({ where }),
      ]);

      return {
        data: mapSoftSkillsToEditorDto(items, languages),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  getSection: protectedProcedure.query(async ({ ctx }) => {
    return ensureSection(ctx.user.id, ctx.db);
  }),

  createItem: protectedProcedure
    .input(softSkillUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const primaryLanguage = resolvePrimaryLanguage(languages);
      const primaryCode = primaryLanguage?.code ?? "en";
      const { title, description } = translationMapToLocalizedFields(
        input.translations,
        languages,
        primaryCode,
      );

      const created = await ctx.db.portfolioSoftSkill.create({
        data: {
          icon: input.icon,
          isVisible: input.isVisible,
          featured: input.featured,
          order: input.order,
          title,
          description,
          userId: ctx.user.id,
        },
      });

      return mapSoftSkillToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(softSkillUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, translations, ...data } = input;
      const existing = await ctx.db.portfolioSoftSkill.findUnique({
        where: { id },
      });

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

      const updated = await ctx.db.portfolioSoftSkill.update({
        where: { id },
        data: {
          ...data,
          title,
          description,
        },
      });

      return mapSoftSkillToEditorDto(updated, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.portfolioSoftSkill.findUnique({
        where: { id: input.id },
      });

      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.portfolioSoftSkill.delete({ where: { id: input.id } });
    }),

  upsertSection: protectedProcedure
    .input(sectionInput)
    .mutation(async ({ ctx, input }) => {
      const { videoUrl, posterUrl, imageUrl, ...rest } = input;
      return ctx.db.softSkillsSection.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          ...rest,
          videoUrl: videoUrl ?? null,
          posterUrl: posterUrl ?? null,
          imageUrl: imageUrl ?? null,
        },
        update: {
          ...rest,
          videoUrl: videoUrl ?? null,
          posterUrl: posterUrl ?? null,
          imageUrl: imageUrl ?? null,
        },
      });
    }),

  reorderItems: protectedProcedure
    .input(z.object({ orderedIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.portfolioSoftSkill.findMany({
        where: { userId: ctx.user.id },
      });

      const ownedIds = new Set(items.map((item) => item.id));
      if (
        input.orderedIds.length !== items.length ||
        input.orderedIds.some((id) => !ownedIds.has(id))
      ) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      await ctx.db.$transaction(
        input.orderedIds.map((id, index) =>
          ctx.db.portfolioSoftSkill.update({
            where: { id },
            data: { order: index },
          }),
        ),
      );

      return { success: true };
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.portfolioSoftSkill.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };
    return ctx.db.portfolioSoftSkill.deleteMany({ where: { id: { in: ids } } });
  }),
});
