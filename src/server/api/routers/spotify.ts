import { z } from "zod";

import {
  getNowPlaying,
  getQueue,
  getRecentlyPlayed,
  getTopTracks,
} from "@/utils/services/spotify";

import { createTRPCRouter, tenantProcedure } from "@/server/api/trpc";

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
  getTopTracks: tenantProcedure
    .input(
      z.object({
        timeRange: z.enum(["short_term", "medium_term", "long_term"]),
        limit: z.number(),
        offset: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timeRange, limit, offset } = input;
      return getTopTracks(ctx.tenant.userId, timeRange, limit, offset);
    }),
});
