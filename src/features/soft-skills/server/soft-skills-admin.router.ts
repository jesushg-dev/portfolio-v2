import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { extractStringFilter } from "@/lib/admin/filter-utils";
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
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";

const SoftSkillsMediaTypeSchema = z.enum(["VIDEO", "IMAGE"]);

const SoftSkillTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
    badge: z
      .string()
      .optional()
      .transform((val) => val ?? ""),
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

const metricInput = z.object({
  id: z.string().optional(),
  value: z.string().default(""),
  order: z.number().int().default(0),
  translations: z
    .record(
      z.string(),
      z.object({
        label: z.string().default(""),
      }),
    )
    .default({}),
});

const sectionInput = z.object({
  mediaType: SoftSkillsMediaTypeSchema,
  videoUrl: z.string().url().or(z.literal("")).optional(),
  posterUrl: z.string().url().or(z.literal("")).optional(),
  imageUrl: z.string().url().or(z.literal("")).optional(),
  metrics: z.array(metricInput).optional(),
});

async function ensureSection(userId: string, db: PrismaClient) {
  const existing = await db.softSkillsSection.findUnique({
    where: { userId },
    include: {
      metrics: {
        include: { SoftSkillsMetricTranslation: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (existing) return existing;

  return db.softSkillsSection.create({
    data: {
      userId,
      mediaType: "VIDEO",
      videoUrl: DEFAULT_SOFT_SKILLS_VIDEO_URL,
      posterUrl: DEFAULT_SOFT_SKILLS_POSTER_URL,
    },
    include: {
      metrics: {
        include: { SoftSkillsMetricTranslation: true },
        orderBy: { order: "asc" },
      },
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
      if (titleVal) {
        where.PortfolioSoftSkillTranslation = {
          some: {
            title: { contains: titleVal, mode: "insensitive" },
          },
        };
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const [items, totalCount] = await Promise.all([
        ctx.db.portfolioSoftSkill.findMany({
          where,
          include: {
            PortfolioSoftSkillTranslation: true,
          },
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
      const { translations, ...data } = input;
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const created = await ctx.db.portfolioSoftSkill.create({
        data: {
          ...data,
          userId: ctx.user.id,
          PortfolioSoftSkillTranslation: {
            create: translationMapEntries(translations).map((translation) => ({
              appLanguageId: translation.appLanguageId,
              title: translation.title,
              description: translation.description,
              badge: translation.badge ?? "",
            })),
          },
        },
        include: {
          PortfolioSoftSkillTranslation: true,
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

      await ctx.db.portfolioSoftSkill.update({
        where: { id },
        data,
      });

      for (const translation of translationMapEntries(translations)) {
        const existingTrans =
          await ctx.db.portfolioSoftSkillTranslation.findFirst({
            where: {
              portfolioSoftSkillId: id,
              appLanguageId: translation.appLanguageId,
            },
          });

        if (existingTrans) {
          await ctx.db.portfolioSoftSkillTranslation.update({
            where: { id: existingTrans.id },
            data: {
              title: translation.title,
              description: translation.description,
              badge: translation.badge ?? "",
            },
          });
        } else {
          await ctx.db.portfolioSoftSkillTranslation.create({
            data: {
              portfolioSoftSkillId: id,
              appLanguageId: translation.appLanguageId,
              title: translation.title,
              description: translation.description,
              badge: translation.badge ?? "",
            },
          });
        }
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });

      const updated = await ctx.db.portfolioSoftSkill.findUnique({
        where: { id },
        include: {
          PortfolioSoftSkillTranslation: true,
        },
      });

      return mapSoftSkillToEditorDto(updated!, languages);
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

      await ctx.db.portfolioSoftSkillTranslation.deleteMany({
        where: { portfolioSoftSkillId: input.id },
      });

      return ctx.db.portfolioSoftSkill.delete({ where: { id: input.id } });
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      if (input.ids.length === 0) return { count: 0 };
      const items = await ctx.db.portfolioSoftSkill.findMany({
        where: { id: { in: input.ids }, userId: ctx.user.id },
        select: { id: true },
      });
      const ids = items.map((i) => i.id);
      if (ids.length === 0) return { count: 0 };
      await ctx.db.portfolioSoftSkillTranslation.deleteMany({
        where: { portfolioSoftSkillId: { in: ids } },
      });
      return ctx.db.portfolioSoftSkill.deleteMany({
        where: { id: { in: ids } },
      });
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.portfolioSoftSkill.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };
    await ctx.db.portfolioSoftSkillTranslation.deleteMany({
      where: { portfolioSoftSkillId: { in: ids } },
    });
    return ctx.db.portfolioSoftSkill.deleteMany({ where: { id: { in: ids } } });
  }),

  upsertSection: protectedProcedure
    .input(sectionInput)
    .mutation(async ({ ctx, input }) => {
      const { videoUrl, posterUrl, imageUrl, metrics, ...rest } = input;
      const section = await ctx.db.softSkillsSection.upsert({
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

      if (metrics) {
        const keepIds = metrics.filter((m) => !!m.id).map((m) => m.id!);
        await ctx.db.softSkillsMetric.deleteMany({
          where: {
            sectionId: section.id,
            id: { notIn: keepIds },
          },
        });

        for (let i = 0; i < metrics.length; i++) {
          const m = metrics[i];
          let metricId = m.id;
          if (metricId) {
            await ctx.db.softSkillsMetric.update({
              where: { id: metricId },
              data: { value: m.value, order: i },
            });
          } else {
            const created = await ctx.db.softSkillsMetric.create({
              data: {
                sectionId: section.id,
                value: m.value,
                order: i,
              },
            });
            metricId = created.id;
          }

          for (const [langId, trans] of Object.entries(m.translations)) {
            await ctx.db.softSkillsMetricTranslation.upsert({
              where: {
                metricId_appLanguageId: {
                  metricId,
                  appLanguageId: langId,
                },
              },
              create: {
                metricId,
                appLanguageId: langId,
                label: trans.label,
              },
              update: {
                label: trans.label,
              },
            });
          }
        }
      }

      return section;
    }),
});
