import { z } from "zod";

import { encryptSecret } from "@/lib/crypto/secret-encryption";
import {
  clearGoogleCalendarAccessTokenCache,
  deleteExpiredGoogleCalendarOAuthStates,
  getGoogleCalendarConnectionForUser,
} from "@/lib/google-calendar/connection";
import {
  buildGoogleCalendarAuthorizeUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "@/lib/google-calendar/oauth";
import { getGoogleCalendarRedirectUri } from "@/lib/google-calendar/redirect-uri";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const initiateConnectInput = z.object({
  locale: z.enum(["en", "es", "nl"]).default("en"),
  clientId: z.string().min(10),
  clientSecret: z.string().min(10),
});

export const googleCalendarAdminRouter = createTRPCRouter({
  getRedirectUri: protectedProcedure.query(() => {
    return { redirectUri: getGoogleCalendarRedirectUri() };
  }),

  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const connection = await getGoogleCalendarConnectionForUser(ctx.user.id);

    if (!connection) {
      return {
        status: "disconnected" as const,
        clientId: null,
        connectedAt: null,
        lastRefreshErrorAt: null,
        lastPullAt: null,
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
      lastPullAt: connection.lastPullAt,
      scope: connection.scope,
    };
  }),

  initiateConnect: protectedProcedure
    .input(initiateConnectInput)
    .mutation(async ({ ctx, input }) => {
      await deleteExpiredGoogleCalendarOAuthStates();

      const state = generateOAuthState();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const clientId = input.clientId.trim();
      const clientSecretEnc = encryptSecret(input.clientSecret.trim());

      await db.googleCalendarOAuthState.create({
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

      const authUrl = buildGoogleCalendarAuthorizeUrl({
        clientId,
        state,
        codeChallenge,
      });

      return { authUrl };
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    clearGoogleCalendarAccessTokenCache(ctx.user.id);
    await db.googleCalendarConnection.deleteMany({
      where: { userId: ctx.user.id },
    });
    return { success: true };
  }),
});
