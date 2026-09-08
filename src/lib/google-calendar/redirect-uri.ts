import "server-only";

import { env } from "@/env";
import { getDevLoopbackOrigin } from "@/lib/spotify/redirect-uri";

/** Google OAuth redirect URI registered in the user's Cloud Console. */
export function getGoogleCalendarRedirectUri(): string {
  if (env.NODE_ENV === "development") {
    return `${getDevLoopbackOrigin()}/api/google-calendar/callback`;
  }

  return `https://${env.PRIMARY_DOMAIN ?? "jesushg.com"}/api/google-calendar/callback`;
}
