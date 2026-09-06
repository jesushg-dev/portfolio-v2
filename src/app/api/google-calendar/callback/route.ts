import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { getIntegrationProviderPath } from "@/features/integrations/lib/integration-paths";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-encryption";
import { exchangeGoogleCalendarAuthorizationCode } from "@/lib/google-calendar/oauth";
import { getDevLoopbackOrigin } from "@/lib/spotify/redirect-uri";
import { db } from "@/server/db";

function googleCalendarIntegrationPath(locale: string): string {
  return getIntegrationProviderPath(locale, "google-calendar");
}

function adminRedirect(
  locale: string,
  params: Record<string, string>,
): NextResponse {
  const search = new URLSearchParams(params);
  return NextResponse.redirect(
    new URL(
      `${googleCalendarIntegrationPath(locale)}?${search.toString()}`,
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
  const googleError = req.nextUrl.searchParams.get("error");

  if (googleError) {
    return adminRedirect("en", { gcal_error: googleError });
  }

  if (!code || !state) {
    return adminRedirect("en", { gcal_error: "missing_params" });
  }

  const oauthState = await db.googleCalendarOAuthState.findUnique({
    where: { state },
  });

  if (!oauthState || oauthState.expiresAt < new Date()) {
    await db.googleCalendarOAuthState
      .deleteMany({ where: { state } })
      .catch(() => undefined);
    return adminRedirect("en", { gcal_error: "invalid_state" });
  }

  const locale = oauthState.locale;

  try {
    const clientSecret = decryptSecret(oauthState.clientSecretEnc);

    const token = await exchangeGoogleCalendarAuthorizationCode({
      clientId: oauthState.clientId,
      clientSecret,
      code,
      codeVerifier: oauthState.codeVerifier,
    });

    if (!token.refresh_token) {
      return adminRedirect(locale, { gcal_error: "no_refresh_token" });
    }

    await db.googleCalendarConnection.upsert({
      where: { userId: oauthState.userId },
      create: {
        userId: oauthState.userId,
        clientId: oauthState.clientId,
        clientSecretEnc: oauthState.clientSecretEnc,
        refreshTokenEnc: encryptSecret(token.refresh_token),
        scope: token.scope ?? null,
      },
      update: {
        clientId: oauthState.clientId,
        clientSecretEnc: oauthState.clientSecretEnc,
        refreshTokenEnc: encryptSecret(token.refresh_token),
        scope: token.scope ?? null,
        connectedAt: new Date(),
        lastRefreshErrorAt: null,
      },
    });

    await db.googleCalendarOAuthState.delete({ where: { id: oauthState.id } });

    return adminRedirect(locale, { gcal_connected: "1" });
  } catch (err) {
    console.error(err);
    await db.googleCalendarOAuthState
      .delete({ where: { id: oauthState.id } })
      .catch(() => undefined);
    return adminRedirect(locale, { gcal_error: "exchange_failed" });
  }
}
