import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

const StackTypeSchema = z.enum([
  "FRONTEND",
  "BACKEND",
  "MOBILE",
  "DESKTOP",
  "CYBERSECURITY",
  "DEVOPS",
  "SOFTSKILLS",
  "TOOLS",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Verify an entity belongs to the current user and return it. Throws NOT_FOUND otherwise. */
async function assertOwner<T extends { userId?: string | null }>(
  entity: T | null,
  userId: string,
): Promise<T> {
  if (!entity || entity.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return entity;
}

const optionalUrl = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const portfolioAdminRouter = createTRPCRouter({
  // ==========================================================================
  // AppLanguage — read-only, shared across all tenants
  // ==========================================================================

  /** Returns the full list of content languages stored in the DB. */
  getAppLanguages: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } });
  }),

  // ==========================================================================
  // SKILLS
  // ==========================================================================

  getMySkills: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.skill.findMany({
      where: { userId: ctx.user.id },
      include: {
        SkillTranslation: { include: { language: true } },
        _count: { select: { ProjectSkill: true, CertificateSkill: true } },
      },
      orderBy: { title: "asc" },
    });
  }),

  createSkill: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        image: z.string().min(1),
        type: StackTypeSchema,
        translations: z
          .array(
            z.object({
              appLanguageId: z.string(),
              description: z.string(),
              urlWiki: z
                .string()
                .url()
                .or(z.literal(""))
                .optional()
                .default(""),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { translations, ...rest } = input;
      return ctx.db.skill.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          SkillTranslation: translations.length
            ? { createMany: { data: translations } }
            : undefined,
        },
        include: { SkillTranslation: { include: { language: true } } },
      });
    }),

  updateSkill: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        image: z.string().min(1),
        type: StackTypeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertOwner(
        await ctx.db.skill.findUnique({ where: { id } }),
        ctx.user.id,
      );
      return ctx.db.skill.update({ where: { id }, data });
    }),

  deleteSkill: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.skill.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );
      return ctx.db.skill.delete({ where: { id: input.id } });
    }),

  /**
   * Upserts a single translation for a skill.
   * If the translation for that language already exists it is updated,
   * otherwise a new one is created.
   */
  upsertSkillTranslation: protectedProcedure
    .input(
      z.object({
        skillId: z.string(),
        appLanguageId: z.string(),
        description: z.string(),
        urlWiki: z.string().url().or(z.literal("")).optional().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.skill.findUnique({ where: { id: input.skillId } }),
        ctx.user.id,
      );
      // Find existing translation for this language
      const existing = await ctx.db.skillTranslation.findFirst({
        where: { skillId: input.skillId, appLanguageId: input.appLanguageId },
      });
      if (existing) {
        return ctx.db.skillTranslation.update({
          where: { id: existing.id },
          data: { description: input.description, urlWiki: input.urlWiki },
        });
      }
      return ctx.db.skillTranslation.create({ data: input });
    }),

  deleteSkillTranslation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const translation = await ctx.db.skillTranslation.findUnique({
        where: { id: input.id },
        include: { Skill: true },
      });
      if (!translation || translation.Skill?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.skillTranslation.delete({ where: { id: input.id } });
    }),

  // ==========================================================================
  // PROJECTS
  // ==========================================================================

  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: { userId: ctx.user.id },
      include: {
        ProjectTranslation: { include: { language: true } },
        ProjectSkill: {
          include: { Skill: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createProject: protectedProcedure
    .input(
      z.object({
        image: z.string().min(1),
        type: StackTypeSchema,
        githubUrl: optionalUrl,
        websiteUrl: optionalUrl,
        isPrivate: z.boolean().default(false),
        skillIds: z.array(z.string()).default([]),
        translations: z
          .array(
            z.object({
              appLanguageId: z.string(),
              title: z.string(),
              description: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { translations, skillIds, ...rest } = input;
      return ctx.db.project.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          ProjectTranslation: translations.length
            ? { createMany: { data: translations } }
            : undefined,
          ProjectSkill: skillIds.length
            ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
            : undefined,
        },
        include: {
          ProjectTranslation: { include: { language: true } },
          ProjectSkill: { include: { Skill: true } },
        },
      });
    }),

  updateProject: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        image: z.string().min(1),
        type: StackTypeSchema,
        githubUrl: z.string().url().optional().nullable(),
        websiteUrl: z.string().url().optional().nullable(),
        isPrivate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertOwner(
        await ctx.db.project.findUnique({ where: { id } }),
        ctx.user.id,
      );
      return ctx.db.project.update({ where: { id }, data });
    }),

  deleteProject: protectedProcedure
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

  upsertProjectTranslation: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        appLanguageId: z.string(),
        title: z.string(),
        description: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.project.findUnique({ where: { id: input.projectId } }),
        ctx.user.id,
      );
      const existing = await ctx.db.projectTranslation.findFirst({
        where: {
          projectId: input.projectId,
          appLanguageId: input.appLanguageId,
        },
      });
      if (existing) {
        return ctx.db.projectTranslation.update({
          where: { id: existing.id },
          data: { title: input.title, description: input.description },
        });
      }
      return ctx.db.projectTranslation.create({ data: input });
    }),

  /**
   * Atomically replaces all skill associations for a project.
   * Deletes existing ProjectSkill rows, then creates the new set.
   */
  syncProjectSkills: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        skillIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.project.findUnique({ where: { id: input.projectId } }),
        ctx.user.id,
      );
      await ctx.db.projectSkill.deleteMany({
        where: { projectId: input.projectId },
      });
      if (input.skillIds.length > 0) {
        await ctx.db.projectSkill.createMany({
          data: input.skillIds.map((skillId) => ({
            projectId: input.projectId,
            skillId,
          })),
        });
      }
      return ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: { ProjectSkill: { include: { Skill: true } } },
      });
    }),

  // ==========================================================================
  // SERVICES
  // ==========================================================================

  getMyServices: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.service.findMany({
      where: { userId: ctx.user.id },
      include: {
        ServiceTranslation: { include: { language: true } },
        ServiceSkill: { include: { Skill: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createService: protectedProcedure
    .input(
      z.object({
        image: z.string().min(1),
        type: StackTypeSchema,
        translations: z
          .array(
            z.object({
              appLanguageId: z.string(),
              title: z.string(),
              description: z.string(),
            }),
          )
          .default([]),
        skillIds: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { translations, skillIds, ...rest } = input;
      return ctx.db.service.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          ServiceTranslation: translations.length
            ? { createMany: { data: translations } }
            : undefined,
          ServiceSkill: skillIds.length
            ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
            : undefined,
        },
        include: {
          ServiceTranslation: { include: { language: true } },
          ServiceSkill: { include: { Skill: true } },
        },
      });
    }),

  updateService: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        image: z.string().min(1),
        type: StackTypeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertOwner(
        await ctx.db.service.findUnique({ where: { id } }),
        ctx.user.id,
      );
      return ctx.db.service.update({ where: { id }, data });
    }),

  deleteService: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.service.findUnique({ where: { id: input.id } }),
        ctx.user.id,
      );
      return ctx.db.service.delete({ where: { id: input.id } });
    }),

  upsertServiceTranslation: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        appLanguageId: z.string(),
        title: z.string(),
        description: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.service.findUnique({ where: { id: input.serviceId } }),
        ctx.user.id,
      );
      const existing = await ctx.db.serviceTranslation.findFirst({
        where: {
          serviceId: input.serviceId,
          appLanguageId: input.appLanguageId,
        },
      });
      if (existing) {
        return ctx.db.serviceTranslation.update({
          where: { id: existing.id },
          data: { title: input.title, description: input.description },
        });
      }
      return ctx.db.serviceTranslation.create({ data: input });
    }),

  /**
   * Atomically replaces all skill associations for a service.
   */
  syncServiceSkills: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        skillIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.service.findUnique({ where: { id: input.serviceId } }),
        ctx.user.id,
      );
      await ctx.db.serviceSkill.deleteMany({
        where: { serviceId: input.serviceId },
      });
      if (input.skillIds.length > 0) {
        await ctx.db.serviceSkill.createMany({
          data: input.skillIds.map((skillId) => ({
            serviceId: input.serviceId,
            skillId,
          })),
        });
      }
      return { success: true };
    }),

  // ==========================================================================
  // CERTIFICATIONS
  // ==========================================================================

  getMyCertifications: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.certification.findMany({
      where: { userId: ctx.user.id },
      include: {
        CertificationTranslation: { include: { language: true } },
        CertificateSkill: { include: { Skill: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createCertification: protectedProcedure
    .input(
      z.object({
        company: z.string().min(1),
        issuedDate: z.number().int().optional(),
        url: optionalUrl,
        idCredential: z.string().optional(),
        image: z.string().optional(),
        type: z.array(StackTypeSchema).default([]),
        skillIds: z.array(z.string()).default([]),
        translations: z
          .array(
            z.object({
              appLanguageId: z.string(),
              title: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { translations, skillIds, ...rest } = input;
      return ctx.db.certification.create({
        data: {
          ...rest,
          userId: ctx.user.id,
          CertificationTranslation: translations.length
            ? { createMany: { data: translations } }
            : undefined,
          CertificateSkill: skillIds.length
            ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
            : undefined,
        },
        include: {
          CertificationTranslation: { include: { language: true } },
          CertificateSkill: { include: { Skill: true } },
        },
      });
    }),

  updateCertification: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        company: z.string().min(1),
        issuedDate: z.number().int().optional().nullable(),
        url: z.string().url().optional().nullable(),
        idCredential: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
        type: z.array(StackTypeSchema).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertOwner(
        await ctx.db.certification.findUnique({ where: { id } }),
        ctx.user.id,
      );
      return ctx.db.certification.update({ where: { id }, data });
    }),

  deleteCertification: protectedProcedure
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

  upsertCertificationTranslation: protectedProcedure
    .input(
      z.object({
        certificationId: z.string(),
        appLanguageId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.certification.findUnique({
          where: { id: input.certificationId },
        }),
        ctx.user.id,
      );
      const existing = await ctx.db.certificationTranslation.findFirst({
        where: {
          certificationId: input.certificationId,
          appLanguageId: input.appLanguageId,
        },
      });
      if (existing) {
        return ctx.db.certificationTranslation.update({
          where: { id: existing.id },
          data: { title: input.title },
        });
      }
      return ctx.db.certificationTranslation.create({ data: input });
    }),

  /** Atomically replaces all skill associations for a certification. */
  syncCertificationSkills: protectedProcedure
    .input(
      z.object({
        certificationId: z.string(),
        skillIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwner(
        await ctx.db.certification.findUnique({
          where: { id: input.certificationId },
        }),
        ctx.user.id,
      );
      await ctx.db.certificateSkill.deleteMany({
        where: { certificationId: input.certificationId },
      });
      if (input.skillIds.length > 0) {
        await ctx.db.certificateSkill.createMany({
          data: input.skillIds.map((skillId) => ({
            certificationId: input.certificationId,
            skillId,
          })),
        });
      }
      return ctx.db.certification.findUnique({
        where: { id: input.certificationId },
        include: { CertificateSkill: { include: { Skill: true } } },
      });
    }),
});
