import { z } from "zod";

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

const ServiceTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
  }),
);

const serviceUpsertInput = z.object({
  image: z.string().min(1),
  type: StackTypeSchema,
  skillIds: z.array(z.string()).default([]),
  translations: ServiceTranslationMapSchema.default({}),
});

export const servicesAdminRouter = createTRPCRouter({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const [services, languages] = await Promise.all([
      ctx.db.service.findMany({
        where: { userId: ctx.user.id },
        include: {
          ServiceTranslation: true,
          ServiceSkill: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    ]);

    return mapServicesToEditorDto(services, languages);
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
