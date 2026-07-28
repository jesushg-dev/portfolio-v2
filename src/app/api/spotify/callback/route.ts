import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { decryptSecret, encryptSecret } from "@/lib/spotify/crypto";
import { exchangeSpotifyAuthorizationCode } from "@/lib/spotify/oauth";
import { getIntegrationProviderPath } from "@/features/integrations/lib/integration-paths";
import { getDevLoopbackOrigin } from "@/lib/spotify/redirect-uri";
import { db } from "@/server/db";

function spotifyIntegrationPath(locale: string): string {
  return getIntegrationProviderPath(locale, "spotify");
}

function adminRedirect(
  locale: string,
  params: Record<string, string>,
): NextResponse {
  const search = new URLSearchParams(params);
  return NextResponse.redirect(
    new URL(
      `${spotifyIntegrationPath(locale)}?${search.toString()}`,
      getRequestOrigin(),
    ),
  );
}

function getRequestOrigin(): string {
  if (env.BETTER_AUTH_URL) {
    return env.BETTER_AUTH_URL.replace(/\/$/, "");
  }

  return env.NODE_ENV === "development"
    ? getDevLoopbackOrigin()
    : `https://${env.PRIMARY_DOMAIN}`;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const spotifyError = req.nextUrl.searchParams.get("error");

  if (spotifyError) {
    return adminRedirect("en", { spotify_error: spotifyError });
  }

  if (!code || !state) {
    return adminRedirect("en", { spotify_error: "missing_params" });
  }

  const oauthState = await db.spotifyOAuthState.findUnique({
    where: { state },
  });

  if (!oauthState || oauthState.expiresAt < new Date()) {
    await db.spotifyOAuthState
      .deleteMany({ where: { state } })
      .catch(() => undefined);
    return adminRedirect("en", { spotify_error: "invalid_state" });
  }

  const locale = oauthState.locale;

  try {
    const clientSecret = decryptSecret(oauthState.clientSecretEnc);

    const token = await exchangeSpotifyAuthorizationCode({
      clientId: oauthState.clientId,
      clientSecret,
      code,
      codeVerifier: oauthState.codeVerifier,
    });

    if (!token.refresh_token) {
      return adminRedirect(locale, { spotify_error: "no_refresh_token" });
    }

    await db.spotifyConnection.upsert({
      where: { userId: oauthState.userId },
      create: {
        userId: oauthState.userId,
        clientId: oauthState.clientId,
        clientSecretEnc: oauthState.clientSecretEnc,
        refreshTokenEnc: encryptSecret(token.refresh_token),
        scope: token.scope,
      },
      update: {
        clientId: oauthState.clientId,
        clientSecretEnc: oauthState.clientSecretEnc,
        refreshTokenEnc: encryptSecret(token.refresh_token),
        scope: token.scope,
        connectedAt: new Date(),
        lastRefreshErrorAt: null,
      },
    });

    await db.spotifyOAuthState.delete({ where: { id: oauthState.id } });

    return adminRedirect(locale, { spotify_connected: "1" });
  } catch (err) {
    console.error(err);
    await db.spotifyOAuthState
      .delete({ where: { id: oauthState.id } })
      .catch(() => undefined);
    return adminRedirect(locale, { spotify_error: "exchange_failed" });
  }
}
