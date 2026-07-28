import "server-only";

import { env } from "@/env";

/** Spotify-allowed loopback origin for local OAuth (not hostname-based HTTP). */
export function getDevLoopbackOrigin(): string {
  const devDomain = env.NEXT_PUBLIC_DEV_DOMAIN ?? "lvh.me:3000";
  const [, port = "3000"] = devDomain.split(":");
  return `http://127.0.0.1:${port}`;
}

/** Spotify OAuth redirect URI registered in the developer dashboard. */
export function getSpotifyRedirectUri(): string {
  if (env.NODE_ENV === "development") {
    return `${getDevLoopbackOrigin()}/api/spotify/callback`;
  }

  return `https://${env.PRIMARY_DOMAIN ?? "jesushg.com"}/api/spotify/callback`;
}
