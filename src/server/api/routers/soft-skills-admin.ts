import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type PrismaClient, type Prisma } from "@prisma/client";

import { LocalizedTextSchema } from "@/lib/i18n/localized";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  DEFAULT_SOFT_SKILLS_POSTER_URL,
  DEFAULT_SOFT_SKILLS_VIDEO_URL,
} from "@/features/soft-skills/lib/soft-skills-media";
import { isSoftSkillIconKey } from "@/features/soft-skills/lib/soft-skill-icons";

const SoftSkillsMediaTypeSchema = z.enum(["VIDEO", "IMAGE"]);

const baseSoftSkillInput = z.object({
  icon: z.string().min(1).refine(isSoftSkillIconKey, {
    message: "Invalid icon key",
  }),
  title: LocalizedTextSchema,
  description: LocalizedTextSchema,
  isVisible: z.boolean().default(true),
  order: z.number().int().nonnegative().default(0),
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
  getMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.portfolioSoftSkill.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }),

  getSection: protectedProcedure.query(async ({ ctx }) => {
    return ensureSection(ctx.user.id, ctx.db);
  }),

  createItem: protectedProcedure
    .input(baseSoftSkillInput)
    .mutation(async ({ ctx, input }) => {
      const { title, description, ...rest } = input;
      return ctx.db.portfolioSoftSkill.create({
        data: {
          ...rest,
          title: title as Prisma.InputJsonValue,
          description: description as Prisma.InputJsonValue,
          userId: ctx.user.id,
        },
      });
    }),

  updateItem: protectedProcedure
    .input(baseSoftSkillInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, title, description, ...data } = input;
      const existing = await ctx.db.portfolioSoftSkill.findUnique({
        where: { id },
      });

      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.portfolioSoftSkill.update({
        where: { id },
        data: {
          ...data,
          title: title as Prisma.InputJsonValue,
          description: description as Prisma.InputJsonValue,
        },
      });
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
});
