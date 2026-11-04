import {
  serviceVisualNodesSchema,
  serviceVisualTypeSchema,
} from "../lib/service-visual";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { buildServiceListWhere } from "../lib/service-list-filters";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  assertOwner,
  StackTypeSchema,
} from "@/features/portfolio/server/portfolio-admin-shared";
import {
  mapServiceToEditorDto,
  mapServicesToEditorDto,
} from "@/features/services/lib/service-editor-dto";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import type { Prisma, PrismaClient } from "@prisma/client";

const ServiceTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
    badge: z.string().default(""),
    statsLabel: z.string().default(""),
    practicePoints: z.string().default(""),
    visualNodes: serviceVisualNodesSchema.default([]),
  }),
);

const serviceUpsertInput = z.object({
  image: z.string().default(""),
  visualType: serviceVisualTypeSchema.default("network"),
  type: StackTypeSchema,
  icon: z.string().default("code"),
  statsValue: z.string().default(""),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
  skillIds: z.array(z.string()).default([]),
  translations: ServiceTranslationMapSchema.default({}),
});

async function ownedServiceSkillIds(
  db: Pick<PrismaClient, "skill">,
  userId: string,
  requested: string[],
) {
  const skillIds = [...new Set(requested)];
  if (
    skillIds.length &&
    (await db.skill.count({ where: { id: { in: skillIds }, userId } })) !==
      skillIds.length
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid service skills",
    });
  }
  return skillIds;
}

export const servicesAdminRouter = createTRPCRouter({
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const groups = await ctx.db.service.groupBy({
      by: ["type"],
      where: { userId: ctx.user.id },
      orderBy: { type: "asc" },
      _count: { _all: true },
    });

    return groups.map((group) => ({
      value: group.type,
      count: group._count._all,
    }));
  }),
  getMine: protectedProcedure
    .input(dataTableParamsSchema)
    .query(async ({ ctx, input }) => {
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      let orderBy: Prisma.ServiceOrderByWithRelationInput = {
        createdAt: "desc",
      };
      if (input.sort && input.sort.length > 0) {
        const sortField = input.sort[0];
        if (sortField.id === "type")
          orderBy = { type: sortField.desc ? "desc" : "asc" };
        if (sortField.id === "createdAt")
          orderBy = { createdAt: sortField.desc ? "desc" : "asc" };
      }

      const where = buildServiceListWhere(ctx.user.id, input.filters);

      const [services, totalCount, languages] = await Promise.all([
        ctx.db.service.findMany({
          where,
          include: {
            ServiceTranslation: true,
            ServiceSkill: true,
          },
          orderBy,
          skip,
          take,
        }),
        ctx.db.service.count({ where }),
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ]);

      return {
        data: mapServicesToEditorDto(services, languages),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  createItem: protectedProcedure
    .input(serviceUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations, skillIds: requestedSkillIds, ...rest } = input;
      const skillIds = await ownedServiceSkillIds(
        ctx.db,
        ctx.user.id,
        requestedSkillIds,
      );
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const translationRows = translationMapEntries(translations);

      const created = await ctx.db.service.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          ServiceTranslation: translationRows.length
            ? { createMany: { data: translationRows } }
            : undefined,
          ServiceSkill: skillIds.length
            ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
            : undefined,
        },
        include: { ServiceTranslation: true, ServiceSkill: true },
      });

      return mapServiceToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(serviceUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, skillIds: requestedSkillIds, translations, ...data } = input;
      await assertOwner(
        await ctx.db.service.findUnique({ where: { id } }),
        ctx.user.id,
      );

      const skillIds = await ownedServiceSkillIds(
        ctx.db,
        ctx.user.id,
        requestedSkillIds,
      );
      await ctx.db.service.update({ where: { id }, data });
      await ctx.db.serviceSkill.deleteMany({ where: { serviceId: id } });
      if (skillIds.length > 0) {
        await ctx.db.serviceSkill.createMany({
          data: skillIds.map((skillId) => ({ serviceId: id, skillId })),
        });
      }
      const translationRows = translationMapEntries(translations).filter(
        (entry) => entry.title.trim() !== "" || entry.description.trim() !== "",
      );
      await ctx.db.serviceTranslation.deleteMany({
        where: {
          serviceId: id,
          appLanguageId: {
            notIn: translationRows.map((entry) => entry.appLanguageId),
          },
        },
      });
      for (const translation of translationRows) {
        const existing = await ctx.db.serviceTranslation.findFirst({
          where: { serviceId: id, appLanguageId: translation.appLanguageId },
        });
        if (existing) {
          await ctx.db.serviceTranslation.update({
            where: { id: existing.id },
            data: {
              title: translation.title,
              description: translation.description,
              badge: translation.badge,
              statsLabel: translation.statsLabel,
              practicePoints: translation.practicePoints,
              visualNodes: translation.visualNodes,
            },
          });
        } else {
          await ctx.db.serviceTranslation.create({
            data: { serviceId: id, ...translation },
          });
        }
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const updated = await ctx.db.service.findUnique({
        where: { id },
        include: { ServiceTranslation: true, ServiceSkill: true },
      });

      return mapServiceToEditorDto(updated!, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.service.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );
      return ctx.db.service.delete({ where: { id: input.id } });
    }),
  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.service.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );
      return ctx.db.service.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),
  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      if (input.ids.length === 0) return { count: 0 };
      const items = await ctx.db.service.findMany({
        where: { id: { in: input.ids }, userId: ctx.user.id },
        select: { id: true },
      });
      const ids = items.map((i) => i.id);
      if (ids.length === 0) return { count: 0 };
      return ctx.db.service.deleteMany({ where: { id: { in: ids } } });
    }),
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.service.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };
    return ctx.db.service.deleteMany({ where: { id: { in: ids } } });
  }),
});
