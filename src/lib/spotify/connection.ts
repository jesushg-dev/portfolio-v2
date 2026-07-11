import "server-only";

import type { SpotifyConnection } from "@prisma/client";

import { db } from "@/server/db";

import { decryptSecret, encryptSecret } from "./crypto";
import { refreshSpotifyAccessToken, SpotifyTokenError } from "./oauth";

export type SpotifyClientCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

const TOKEN_REFRESH_BUFFER_SEC = 60;

type CachedAccessToken = {
  token: string;
  expiresAt: number;
};

/** In-memory access token cache per portfolio owner (shared by all API calls). */
const accessTokenCache = new Map<string, CachedAccessToken>();

/** Coalesces concurrent refresh attempts for the same user into one request. */
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
  if (!(error instanceof SpotifyTokenError)) {
    return false;
  }

  if (error.status === 401 || error.status === 403) {
    return true;
  }

  return error.status === 400 && error.errorCode === "invalid_grant";
}

export function clearSpotifyAccessTokenCache(userId?: string): void {
  if (userId) {
    accessTokenCache.delete(userId);
    refreshInFlight.delete(userId);
    return;
  }

  accessTokenCache.clear();
  refreshInFlight.clear();
}

export function connectionToCredentials(
  connection: SpotifyConnection,
): SpotifyClientCredentials {
  return {
    clientId: connection.clientId,
    clientSecret: decryptSecret(connection.clientSecretEnc),
    refreshToken: decryptSecret(connection.refreshTokenEnc),
  };
}

export async function getSpotifyConnectionForUser(
  userId: string,
): Promise<SpotifyConnection | null> {
  return db.spotifyConnection.findUnique({ where: { userId } });
}

export async function getSpotifyCredentialsForUser(
  userId: string,
): Promise<SpotifyClientCredentials | null> {
  const connection = await getSpotifyConnectionForUser(userId);
  if (!connection) {
    return null;
  }

  return connectionToCredentials(connection);
}

async function persistSuccessfulRefresh(
  userId: string,
  token: Awaited<ReturnType<typeof refreshSpotifyAccessToken>>,
): Promise<void> {
  const connection = await getSpotifyConnectionForUser(userId);
  if (!connection) return;

  await db.spotifyConnection.update({
    where: { userId },
    data: {
      ...(token.refresh_token
        ? { refreshTokenEnc: encryptSecret(token.refresh_token) }
        : {}),
      scope: token.scope,
      lastRefreshErrorAt: null,
    },
  });
}

async function refreshAccessTokenForUser(
  userId: string,
  credentials: SpotifyClientCredentials,
): Promise<string | null> {
  try {
    const token = await refreshSpotifyAccessToken({
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
      const connection = await getSpotifyConnectionForUser(userId);
      if (connection) {
        await db.spotifyConnection.update({
          where: { userId },
          data: { lastRefreshErrorAt: new Date() },
        });
      }
    }

    return null;
  }
}

export async function getSpotifyAccessTokenForUser(
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

  const credentials = await getSpotifyCredentialsForUser(userId);
  if (!credentials) {
    clearSpotifyAccessTokenCache(userId);
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

export async function deleteExpiredOAuthStates(): Promise<void> {
  await db.spotifyOAuthState.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
