import { z } from "zod";

import { extractStringFilter } from "@/lib/admin/filter-utils";

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
import type { Prisma, StackType } from "@prisma/client";

const ServiceTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
    badge: z.string().default(""),
    statsLabel: z.string().default(""),
  }),
);

const serviceUpsertInput = z.object({
  image: z.string().default(""),
  type: StackTypeSchema,
  icon: z.string().default("code"),
  statsValue: z.string().default(""),
  featured: z.boolean().default(false),
  order: z.number().default(0),
  skillIds: z.array(z.string()).default([]),
  translations: ServiceTranslationMapSchema.default({}),
});

export const servicesAdminRouter = createTRPCRouter({
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

      const where: Prisma.ServiceWhereInput = { userId: ctx.user.id };
      const titleVal = extractStringFilter(input.filters, "title");
      if (titleVal) {
        where.ServiceTranslation = {
          some: {
            title: { contains: titleVal, mode: "insensitive" },
          },
        };
      }

      const typeVal = extractStringFilter(input.filters, "type");
      if (typeVal) {
        where.type = typeVal as StackType;
      }

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
      const { translations, skillIds, ...rest } = input;
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
      const { id, skillIds, translations, ...data } = input;
      await assertOwner(
        await ctx.db.service.findUnique({ where: { id } }),
        ctx.user.id,
      );

      await ctx.db.service.update({ where: { id }, data });
      await ctx.db.serviceSkill.deleteMany({ where: { serviceId: id } });
      if (skillIds.length > 0) {
        await ctx.db.serviceSkill.createMany({
          data: skillIds.map((skillId) => ({ serviceId: id, skillId })),
        });
      }
      for (const translation of translationMapEntries(translations).filter(
        (entry) => entry.title.trim() !== "" || entry.description.trim() !== "",
      )) {
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
