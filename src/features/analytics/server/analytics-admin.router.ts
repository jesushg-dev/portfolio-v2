import { z } from "zod";

import { emptyAnalyticsSummary } from "@/features/analytics/lib/summarize";
import { getAnalyticsSummary } from "@/features/analytics/server/queries";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const analyticsAdminRouter = createTRPCRouter({
  getDashboard: protectedProcedure
    .input(
      z
        .object({ days: z.number().int().min(1).max(90).default(30) })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      if (!userId) return emptyAnalyticsSummary();
      return getAnalyticsSummary(userId, {
        days: input?.days ?? 30,
        includeReferrers: true,
      });
    }),
});
