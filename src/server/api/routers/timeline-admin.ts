import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type Prisma } from "@prisma/client";

import { LocalizedTextSchema } from "@/lib/i18n/localized";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const TimelineCategorySchema = z.enum(["WORK", "STUDY", "COURSE"]);

const baseTimelineInput = z.object({
  title: LocalizedTextSchema,
  description: LocalizedTextSchema,
  category: TimelineCategorySchema,
  organization: z.string().min(1),
  location: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  current: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
});

export const timelineAdminRouter = createTRPCRouter({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.timelineItem.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ order: "asc" }, { startDate: "desc" }],
    });
  }),

  createItem: protectedProcedure
    .input(baseTimelineInput)
    .mutation(async ({ ctx, input }) => {
      const { title, description, ...rest } = input;
      return ctx.db.timelineItem.create({
        data: {
          ...rest,
          title: title as Prisma.InputJsonValue,
          description: description as Prisma.InputJsonValue,
          userId: ctx.user.id,
        },
      });
    }),

  updateItem: protectedProcedure
    .input(baseTimelineInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, title, description, ...data } = input;
      const existing = await ctx.db.timelineItem.findUnique({ where: { id } });

      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.timelineItem.update({
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
      const existing = await ctx.db.timelineItem.findUnique({
        where: { id: input.id },
      });

      if (existing?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.timelineItem.delete({ where: { id: input.id } });
    }),
});
