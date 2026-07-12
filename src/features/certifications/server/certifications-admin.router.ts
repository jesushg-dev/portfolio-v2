import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  assertOwner,
  optionalUrl,
  StackTypeSchema,
} from "@/features/portfolio/server/portfolio-admin-shared";
import {
  mapCertificationToEditorDto,
  mapCertificationsToEditorDto,
} from "@/features/certifications/lib/certification-editor-dto";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import type { Prisma } from "@prisma/client";

const CertificationTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
  }),
);

const certificationUpsertInput = z.object({
  company: z.string().min(1),
  issuedDate: z.number().int().optional(),
  url: optionalUrl,
  idCredential: z.string().optional(),
  image: z.string().optional(),
  type: z.array(StackTypeSchema).default([]),
  skillIds: z.array(z.string()).default([]),
  translations: CertificationTranslationMapSchema.default({}),
});

export const certificationsAdminRouter = createTRPCRouter({
  getMine: protectedProcedure
    .input(dataTableParamsSchema)
    .query(async ({ ctx, input }) => {
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      let orderBy: Prisma.CertificationOrderByWithRelationInput = {
        createdAt: "desc",
      };
      if (input.sort && input.sort.length > 0) {
        const sortField = input.sort[0];
        if (sortField.id === "company")
          orderBy = { company: sortField.desc ? "desc" : "asc" };
        if (sortField.id === "createdAt")
          orderBy = { createdAt: sortField.desc ? "desc" : "asc" };
      }

      const where: Prisma.CertificationWhereInput = { userId: ctx.user.id };
      if (input.filters && input.filters.length > 0) {
        const titleFilter = input.filters.find((f) => f.id === "title");
        if (titleFilter && typeof titleFilter.value === "string") {
          where.CertificationTranslation = {
            some: {
              title: { contains: titleFilter.value, mode: "insensitive" },
            },
          };
        }
        const companyFilter = input.filters.find((f) => f.id === "company");
        if (companyFilter && typeof companyFilter.value === "string") {
          where.company = {
            contains: companyFilter.value,
            mode: "insensitive",
          };
        }
      }

      const [certifications, totalCount, languages] = await Promise.all([
        ctx.db.certification.findMany({
          where,
          include: {
            CertificationTranslation: true,
            CertificateSkill: true,
          },
          orderBy,
          skip,
          take,
        }),
        ctx.db.certification.count({ where }),
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ]);

      return {
        data: mapCertificationsToEditorDto(certifications, languages),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  createItem: protectedProcedure
    .input(certificationUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const { translations, skillIds, ...rest } = input;
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const translationRows = translationMapEntries(translations);

      const created = await ctx.db.certification.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          CertificationTranslation: translationRows.length
            ? { createMany: { data: translationRows } }
            : undefined,
          CertificateSkill: skillIds.length
            ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
            : undefined,
        },
        include: { CertificationTranslation: true, CertificateSkill: true },
      });

      return mapCertificationToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(
      certificationUpsertInput.extend({
        id: z.string(),
        issuedDate: z.number().int().optional().nullable(),
        url: z.string().url().optional().nullable(),
        idCredential: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, skillIds, translations, ...data } = input;
      await assertOwner(
        await ctx.db.certification.findUnique({ where: { id } }),
        ctx.user.id,
      );

      await ctx.db.certification.update({ where: { id }, data });
      await ctx.db.certificateSkill.deleteMany({
        where: { certificationId: id },
      });
      if (skillIds.length > 0) {
        await ctx.db.certificateSkill.createMany({
          data: skillIds.map((skillId) => ({ certificationId: id, skillId })),
        });
      }

      for (const translation of translationMapEntries(translations).filter(
        (entry) => entry.title.trim() !== "",
      )) {
        const existing = await ctx.db.certificationTranslation.findFirst({
          where: {
            certificationId: id,
            appLanguageId: translation.appLanguageId,
          },
        });
        if (existing) {
          await ctx.db.certificationTranslation.update({
            where: { id: existing.id },
            data: { title: translation.title },
          });
        } else {
          await ctx.db.certificationTranslation.create({
            data: { certificationId: id, ...translation },
          });
        }
      }

      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const updated = await ctx.db.certification.findUnique({
        where: { id },
        include: { CertificationTranslation: true, CertificateSkill: true },
      });

      return mapCertificationToEditorDto(updated!, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.certification.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );

      return ctx.db.$transaction(async (tx) => {
        await tx.certificateSkill.deleteMany({
          where: { certificationId: input.id },
        });
        await tx.certificateProject.deleteMany({
          where: { certificationId: input.id },
        });
        await tx.certificateService.deleteMany({
          where: { certificationId: input.id },
        });
        await tx.certificationTranslation.deleteMany({
          where: { certificationId: input.id },
        });
        return tx.certification.delete({ where: { id: input.id } });
      });
    }),
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.certification.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };

    return ctx.db.$transaction(async (tx) => {
      await tx.certificateSkill.deleteMany({
        where: { certificationId: { in: ids } },
      });
      await tx.certificateProject.deleteMany({
        where: { certificationId: { in: ids } },
      });
      await tx.certificateService.deleteMany({
        where: { certificationId: { in: ids } },
      });
      await tx.certificationTranslation.deleteMany({
        where: { certificationId: { in: ids } },
      });
      return tx.certification.deleteMany({ where: { id: { in: ids } } });
    });
  }),
});
