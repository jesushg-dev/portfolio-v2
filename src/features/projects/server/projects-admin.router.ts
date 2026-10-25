import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { extractStringFilter } from "@/lib/admin/filter-utils";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  assertOwner,
  optionalUrl,
  StackTypeSchema,
} from "@/lib/admin/portfolio-schemas";
import { isAbsoluteOrLocalImagePath } from "@/utils/tools/image";
import {
  mapProjectToEditorDto,
  mapProjectsToEditorDto,
} from "@/features/projects/lib/project-editor-dto";
import {
  buildEmptyCaseStudy,
  CaseStudyContentSchema,
  caseStudyDtoToWrite,
} from "@/features/projects/lib/case-study";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import { dataTableParamsSchema } from "@/lib/admin/data-table-schemas";
import { type Prisma, type StackType } from "@prisma/client";

const ProjectTranslationMapSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
    caseStudy: CaseStudyContentSchema.default(buildEmptyCaseStudy),
  }),
);

const projectUpsertInput = z.object({
  image: z.string().min(1).refine(isAbsoluteOrLocalImagePath),
  type: StackTypeSchema,
  githubUrl: optionalUrl,
  websiteUrl: optionalUrl,
  isPrivate: z.boolean().default(false),
  skillIds: z.array(z.string()).default([]),
  certificateIds: z.array(z.string()).default([]),
  order: z.number().int().default(0),
  kind: z.enum(["PROFESSIONAL", "PERSONAL", "LEARNING"]).default("PERSONAL"),
  slug: z.string().optional(),
  caseStudyEnabled: z.boolean().default(false),
  status: z
    .enum(["IN_PRODUCTION", "MAINTENANCE", "ARCHIVED"])
    .optional()
    .nullable(),
  startedAt: z.string().optional().nullable(),
  endedAt: z.string().optional().nullable(),
  teamSize: z.number().int().positive().optional().nullable(),
  translations: ProjectTranslationMapSchema.default({}),
});

function populatedTranslations(
  translations: z.infer<typeof ProjectTranslationMapSchema>,
) {
  return translationMapEntries(translations).filter(
    (translation) =>
      translation.title.trim() ||
      translation.description.trim() ||
      caseStudyDtoToWrite(translation.caseStudy),
  );
}

export const projectsAdminRouter = createTRPCRouter({
  getMine: protectedProcedure
    .input(dataTableParamsSchema)
    .query(async ({ ctx, input }) => {
      const skip =
        input.page && input.perPage
          ? (input.page - 1) * input.perPage
          : undefined;
      const take = input.perPage ?? undefined;

      let orderBy: Prisma.ProjectOrderByWithRelationInput = {
        createdAt: "desc",
      };
      if (input.sort && input.sort.length > 0) {
        const sortField = input.sort[0];
        if (sortField.id === "type") {
          orderBy = { type: sortField.desc ? "desc" : "asc" };
        }
      }

      const where: Prisma.ProjectWhereInput = { userId: ctx.user.id };

      const typeVal = extractStringFilter(input.filters, "type");
      if (typeVal) {
        where.type = typeVal as StackType;
      }

      const titleVal = extractStringFilter(input.filters, "title");
      if (titleVal) {
        where.ProjectTranslation = {
          some: {
            title: {
              contains: titleVal,
              mode: "insensitive",
            },
          },
        };
      }

      const [projects, totalCount, languages] = await Promise.all([
        ctx.db.project.findMany({
          where,
          include: {
            ProjectTranslation: true,
            ProjectSkill: true,
            CertificateProject: true,
          },
          orderBy,
          skip,
          take,
        }),
        ctx.db.project.count({ where }),
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ]);

      return {
        data: mapProjectsToEditorDto(projects, languages),
        pageCount: take ? Math.ceil(totalCount / take) : 1,
        totalCount,
      };
    }),

  createItem: protectedProcedure
    .input(projectUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const {
        translations,
        skillIds,
        certificateIds,
        startedAt,
        endedAt,
        ...rest
      } = input;
      const languages = await ctx.db.appLanguage.findMany({
        orderBy: { code: "asc" },
      });
      const translationRows = populatedTranslations(translations);
      const uniqueSkillIds = [...new Set(skillIds)];
      const uniqueCertificateIds = [...new Set(certificateIds)];
      const [ownedSkills, ownedCertificates] = await Promise.all([
        ctx.db.skill.count({
          where: { id: { in: uniqueSkillIds }, userId: ctx.user.id },
        }),
        ctx.db.certification.count({
          where: { id: { in: uniqueCertificateIds }, userId: ctx.user.id },
        }),
      ]);
      if (
        ownedSkills !== uniqueSkillIds.length ||
        ownedCertificates !== uniqueCertificateIds.length ||
        translationRows.some(
          (row) =>
            !languages.some((language) => language.id === row.appLanguageId),
        ) ||
        !translationRows.some(
          (row) =>
            row.appLanguageId === resolvePrimaryLanguage(languages)?.id &&
            row.title.trim(),
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid project references",
        });
      }

      const created = await ctx.db.project.create({
        data: {
          ...rest,
          startedAt: startedAt ? new Date(startedAt) : null,
          endedAt: endedAt ? new Date(endedAt) : null,
          userId: ctx.user.id,
          ProjectTranslation: translationRows.length
            ? {
                createMany: {
                  data: translationRows.map((translation) => ({
                    ...translation,
                    caseStudy:
                      caseStudyDtoToWrite(translation.caseStudy) ?? undefined,
                  })),
                },
              }
            : undefined,
          ProjectSkill: uniqueSkillIds.length
            ? {
                createMany: {
                  data: uniqueSkillIds.map((skillId) => ({ skillId })),
                },
              }
            : undefined,
          CertificateProject: uniqueCertificateIds.length
            ? {
                createMany: {
                  data: uniqueCertificateIds.map((certificationId) => ({
                    certificationId,
                  })),
                },
              }
            : undefined,
        },
        include: {
          ProjectTranslation: true,
          ProjectSkill: true,
          CertificateProject: true,
        },
      });

      return mapProjectToEditorDto(created, languages);
    }),

  updateItem: protectedProcedure
    .input(projectUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const {
        id,
        skillIds,
        certificateIds,
        translations,
        startedAt,
        endedAt,
        ...data
      } = input;
      await assertOwner(
        await ctx.db.project.findUnique({ where: { id } }),
        ctx.user.id,
      );
      const translationRows = populatedTranslations(translations);
      const uniqueSkillIds = [...new Set(skillIds)];
      const uniqueCertificateIds = [...new Set(certificateIds)];
      const [ownedSkills, ownedCertificates, languages] = await Promise.all([
        ctx.db.skill.count({
          where: { id: { in: uniqueSkillIds }, userId: ctx.user.id },
        }),
        ctx.db.certification.count({
          where: { id: { in: uniqueCertificateIds }, userId: ctx.user.id },
        }),
        ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      ]);
      if (
        ownedSkills !== uniqueSkillIds.length ||
        ownedCertificates !== uniqueCertificateIds.length ||
        translationRows.some(
          (row) =>
            !languages.some((language) => language.id === row.appLanguageId),
        ) ||
        !translationRows.some(
          (row) =>
            row.appLanguageId === resolvePrimaryLanguage(languages)?.id &&
            row.title.trim(),
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid project references",
        });
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.project.update({
          where: { id },
          data: {
            ...data,
            startedAt: startedAt ? new Date(startedAt) : null,
            endedAt: endedAt ? new Date(endedAt) : null,
          },
        });
        await tx.projectSkill.deleteMany({ where: { projectId: id } });
        if (uniqueSkillIds.length > 0) {
          await tx.projectSkill.createMany({
            data: uniqueSkillIds.map((skillId) => ({ projectId: id, skillId })),
          });
        }
        await tx.certificateProject.deleteMany({ where: { projectId: id } });
        if (uniqueCertificateIds.length > 0) {
          await tx.certificateProject.createMany({
            data: uniqueCertificateIds.map((certificationId) => ({
              projectId: id,
              certificationId,
            })),
          });
        }
        await tx.projectTranslation.deleteMany({
          where: {
            projectId: id,
            appLanguageId: {
              notIn: translationRows.map((row) => row.appLanguageId),
            },
          },
        });
        for (const translation of translationRows) {
          const existing = await tx.projectTranslation.findFirst({
            where: { projectId: id, appLanguageId: translation.appLanguageId },
          });
          const caseStudy = caseStudyDtoToWrite(translation.caseStudy);
          if (existing) {
            await tx.projectTranslation.update({
              where: { id: existing.id },
              data: {
                title: translation.title,
                description: translation.description,
                caseStudy: caseStudy ? { set: caseStudy } : { unset: true },
              },
            });
          } else {
            await tx.projectTranslation.create({
              data: {
                projectId: id,
                ...translation,
                caseStudy: caseStudy ?? undefined,
              },
            });
          }
        }
      });

      const updated = await ctx.db.project.findUnique({
        where: { id },
        include: {
          ProjectTranslation: true,
          ProjectSkill: true,
          CertificateProject: true,
        },
      });

      return mapProjectToEditorDto(updated!, languages);
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.project.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );

      return ctx.db.$transaction(async (tx) => {
        await tx.projectSkill.deleteMany({ where: { projectId: input.id } });
        await tx.projectTranslation.deleteMany({
          where: { projectId: input.id },
        });
        await tx.certificateProject.deleteMany({
          where: { projectId: input.id },
        });
        return tx.project.delete({ where: { id: input.id } });
      });
    }),
  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.project.findMany({
        where: { id: { in: input.ids }, userId: ctx.user.id },
        select: { id: true },
      });
      const ids = items.map((i) => i.id);
      if (ids.length === 0) return { count: 0 };

      return ctx.db.$transaction(async (tx) => {
        await tx.projectSkill.deleteMany({ where: { projectId: { in: ids } } });
        await tx.projectTranslation.deleteMany({
          where: { projectId: { in: ids } },
        });
        await tx.certificateProject.deleteMany({
          where: { projectId: { in: ids } },
        });
        return tx.project.deleteMany({ where: { id: { in: ids } } });
      });
    }),
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const items = await ctx.db.project.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return { count: 0 };

    return ctx.db.$transaction(async (tx) => {
      await tx.projectSkill.deleteMany({ where: { projectId: { in: ids } } });
      await tx.projectTranslation.deleteMany({
        where: { projectId: { in: ids } },
      });
      await tx.certificateProject.deleteMany({
        where: { projectId: { in: ids } },
      });
      return tx.project.deleteMany({ where: { id: { in: ids } } });
    });
  }),
});
