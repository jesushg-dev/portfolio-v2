import "server-only";

import type { GoogleCalendarConnection } from "@prisma/client";

import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-encryption";
import { db } from "@/server/db";

import {
  refreshGoogleCalendarAccessToken,
  GoogleCalendarTokenError,
} from "./oauth";

export interface GoogleCalendarClientCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

const TOKEN_REFRESH_BUFFER_SEC = 60;

interface CachedAccessToken {
  token: string;
  expiresAt: number;
}

const accessTokenCache = new Map<string, CachedAccessToken>();
const refreshInFlight = new Map<string, Promise<string | null>>();

function getValidCachedAccessToken(userId: string): string | null {
  const cached = accessTokenCache.get(userId);
  if (!cached || cached.expiresAt <= Date.now()) {
    return null;
  }

  return cached.token;
}

function cacheAccessToken(
  userId: string,
  accessToken: string,
  expiresInSec: number,
): void {
  const ttlSec = Math.max(expiresInSec - TOKEN_REFRESH_BUFFER_SEC, 30);

  accessTokenCache.set(userId, {
    token: accessToken,
    expiresAt: Date.now() + ttlSec * 1000,
  });
}

function isPermanentRefreshFailure(error: unknown): boolean {
  if (!(error instanceof GoogleCalendarTokenError)) {
    return false;
  }

  if (error.status === 401 || error.status === 403) {
    return true;
  }

  return error.status === 400 && error.errorCode === "invalid_grant";
}

export function clearGoogleCalendarAccessTokenCache(userId?: string): void {
  if (userId) {
    accessTokenCache.delete(userId);
    refreshInFlight.delete(userId);
    return;
  }

  accessTokenCache.clear();
  refreshInFlight.clear();
}

export function connectionToCredentials(
  connection: GoogleCalendarConnection,
): GoogleCalendarClientCredentials {
  return {
    clientId: connection.clientId,
    clientSecret: decryptSecret(connection.clientSecretEnc),
    refreshToken: decryptSecret(connection.refreshTokenEnc),
  };
}

export async function getGoogleCalendarConnectionForUser(
  userId: string,
): Promise<GoogleCalendarConnection | null> {
  return db.googleCalendarConnection.findUnique({ where: { userId } });
}

export async function getGoogleCalendarCredentialsForUser(
  userId: string,
): Promise<GoogleCalendarClientCredentials | null> {
  const connection = await getGoogleCalendarConnectionForUser(userId);
  if (!connection) {
    return null;
  }

  return connectionToCredentials(connection);
}

async function persistSuccessfulRefresh(
  userId: string,
  token: Awaited<ReturnType<typeof refreshGoogleCalendarAccessToken>>,
): Promise<void> {
  const connection = await getGoogleCalendarConnectionForUser(userId);
  if (!connection) return;

  await db.googleCalendarConnection.update({
    where: { userId },
    data: {
      ...(token.refresh_token
        ? { refreshTokenEnc: encryptSecret(token.refresh_token) }
        : {}),
      ...(token.scope ? { scope: token.scope } : {}),
      lastRefreshErrorAt: null,
    },
  });
}

async function refreshAccessTokenForUser(
  userId: string,
  credentials: GoogleCalendarClientCredentials,
): Promise<string | null> {
  try {
    const token = await refreshGoogleCalendarAccessToken({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      refreshToken: credentials.refreshToken,
    });

    await persistSuccessfulRefresh(userId, token);
    cacheAccessToken(userId, token.access_token, token.expires_in);

    return token.access_token;
  } catch (error) {
    accessTokenCache.delete(userId);

    if (isPermanentRefreshFailure(error)) {
      const connection = await getGoogleCalendarConnectionForUser(userId);
      if (connection) {
        await db.googleCalendarConnection.update({
          where: { userId },
          data: { lastRefreshErrorAt: new Date() },
        });
      }
    }

    return null;
  }
}

export async function getGoogleCalendarAccessTokenForUser(
  userId: string,
  options?: { forceRefresh?: boolean },
): Promise<string | null> {
  if (!options?.forceRefresh) {
    const cachedToken = getValidCachedAccessToken(userId);
    if (cachedToken) {
      return cachedToken;
    }
  } else {
    accessTokenCache.delete(userId);
  }

  const credentials = await getGoogleCalendarCredentialsForUser(userId);
  if (!credentials) {
    clearGoogleCalendarAccessTokenCache(userId);
    return null;
  }

  const inFlight = refreshInFlight.get(userId);
  if (inFlight) {
    return inFlight;
  }

  const promise = refreshAccessTokenForUser(userId, credentials).finally(() => {
    refreshInFlight.delete(userId);
  });

  refreshInFlight.set(userId, promise);
  return promise;
}

export async function deleteExpiredGoogleCalendarOAuthStates(): Promise<void> {
  await db.googleCalendarOAuthState.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
