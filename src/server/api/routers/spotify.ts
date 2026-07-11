import { z } from "zod";

import {
  getNowPlaying,
  getQueue,
  getRecentlyPlayed,
  getTopTracks,
} from "@/utils/services/spotify";

import {
  createTRPCRouter,
  publicProcedure,
  tenantProcedure,
} from "@/server/api/trpc";

export const spotifyRouter = createTRPCRouter({
  getNowPlaying: tenantProcedure.input(z.undefined()).query(async ({ ctx }) => {
    return getNowPlaying(ctx.tenant.userId);
  }),
  getQueue: tenantProcedure.input(z.undefined()).query(async ({ ctx }) => {
    return getQueue(ctx.tenant.userId);
  }),
  getRecentlyPlayed: tenantProcedure
    .input(z.undefined())
    .query(async ({ ctx }) => {
      return getRecentlyPlayed(ctx.tenant.userId);
    }),
  getTopTracks: publicProcedure
    .input(
      z.object({
        timeRange: z.enum(["short_term", "medium_term", "long_term"]),
        limit: z.number(),
        offset: z.number(),
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.tenant?.userId;
      if (!userId) {
        return {
          error: { message: "Tenant not found", status: 404 },
        };
      }
      const { timeRange, limit, offset } = input;
      return getTopTracks(userId, timeRange, limit, offset);
    }),
});
