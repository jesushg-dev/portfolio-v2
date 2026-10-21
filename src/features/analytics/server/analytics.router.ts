import { z } from "zod";

import { emptyAnalyticsSummary } from "@/features/analytics/lib/summarize";
import { getAnalyticsSummary } from "@/features/analytics/server/queries";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
  getPublicSummary: publicProcedure
    .input(
      z
        .object({ days: z.number().int().min(1).max(90).default(30) })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.tenant?.userId;
      if (!userId) return emptyAnalyticsSummary();
      return getAnalyticsSummary(userId, {
        days: input?.days ?? 30,
        includeReferrers: false,
      });
    }),
});
