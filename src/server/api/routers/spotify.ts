import { z } from "zod";

import { getNowPlaying, getTopTracks } from "@/utils/services/spotify";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const spotifyRouter = createTRPCRouter({
  getNowPlaying: publicProcedure.input(z.undefined()).query(async () => {
    return await getNowPlaying();
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
