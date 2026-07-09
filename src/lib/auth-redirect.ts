import type { Locale } from "next-intl";
import { headers } from "next/headers";

import { redirect } from "@/i18n/routing";
import { localizedToInternalPath } from "@/lib/i18n-path";
import type { InternalPathHref } from "@/lib/auth-routing";

/** Redirect unauthenticated users to login, preserving locale and return path. */
export async function redirectToLogin(locale: Locale): Promise<never> {
  const headersList = await headers();
  const requestPath =
    headersList.get("x-middleware-request-pathname") ??
    headersList.get("x-pathname") ??
    "/admin";
  const next = localizedToInternalPath(requestPath, locale) as InternalPathHref;

  return redirect({
    href: {
      pathname: "/login",
      query: { next },
    },
    locale,
  });
}
