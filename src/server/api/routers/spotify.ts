import { z } from "zod";

import {
  getNowPlaying,
  getQueue,
  getRecentlyPlayed,
  getTopTracks,
} from "@/utils/services/spotify";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const spotifyRouter = createTRPCRouter({
  getNowPlaying: publicProcedure.input(z.undefined()).query(async () => {
    return await getNowPlaying();
  }),
  getQueue: publicProcedure.input(z.undefined()).query(async () => {
    return await getQueue();
  }),
  getRecentlyPlayed: publicProcedure.input(z.undefined()).query(async () => {
    return await getRecentlyPlayed();
  }),
  getTopTracks: publicProcedure
    .input(
      z.object({
        timeRange: z.enum(["short_term", "medium_term", "long_term"]),
        limit: z.number(),
        offset: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const { timeRange, limit, offset } = input;
      const data = await getTopTracks(timeRange, limit, offset);
      return data;
    }),
});
