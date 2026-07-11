import { z } from "zod";

import { encryptSecret } from "@/lib/spotify/crypto";
import {
  clearSpotifyAccessTokenCache,
  deleteExpiredOAuthStates,
  getSpotifyConnectionForUser,
} from "@/lib/spotify/connection";
import {
  buildSpotifyAuthorizeUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "@/lib/spotify/oauth";
import { getSpotifyRedirectUri } from "@/lib/spotify/redirect-uri";
import { getNowPlaying } from "@/utils/services/spotify";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const initiateConnectInput = z.object({
  locale: z.enum(["en", "es", "nl"]).default("en"),
  clientId: z.string().min(10),
  clientSecret: z.string().min(10),
});

export const spotifyAdminRouter = createTRPCRouter({
  getRedirectUri: protectedProcedure.query(() => {
    return { redirectUri: getSpotifyRedirectUri() };
  }),

  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const connection = await getSpotifyConnectionForUser(ctx.user.id);

    if (!connection) {
      return {
        status: "disconnected" as const,
        clientId: null,
        connectedAt: null,
        lastRefreshErrorAt: null,
        scope: null,
      };
    }

    return {
      status: connection.lastRefreshErrorAt
        ? ("refresh_error" as const)
        : ("connected" as const),
      clientId: connection.clientId,
      connectedAt: connection.connectedAt,
      lastRefreshErrorAt: connection.lastRefreshErrorAt,
      scope: connection.scope,
    };
  }),

  initiateConnect: protectedProcedure
    .input(initiateConnectInput)
    .mutation(async ({ ctx, input }) => {
      await deleteExpiredOAuthStates();

      const state = generateOAuthState();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const clientId = input.clientId.trim();
      const clientSecretEnc = encryptSecret(input.clientSecret.trim());

      await db.spotifyOAuthState.create({
        data: {
          state,
          userId: ctx.user.id,
          clientId,
          clientSecretEnc,
          codeVerifier,
          locale: input.locale,
          expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
        },
      });

      const authUrl = buildSpotifyAuthorizeUrl({
        clientId,
        state,
        codeChallenge,
      });

      return { authUrl };
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    clearSpotifyAccessTokenCache(ctx.user.id);
    await db.spotifyConnection.deleteMany({
      where: { userId: ctx.user.id },
    });
    return { success: true };
  }),

  testNowPlaying: protectedProcedure.query(async ({ ctx }) => {
    return getNowPlaying(ctx.user.id);
  }),
});
