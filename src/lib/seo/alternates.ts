import type { Metadata } from "next";

import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { safeInternalPath } from "@/lib/auth-routing";
import { localizedToInternalPath } from "@/lib/i18n-path";
import { getPathname } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/site";

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}

export function buildLocaleAlternates(
  locale: Locale,
  requestPathname: string,
): NonNullable<Metadata["alternates"]> {
  const internalPath = safeInternalPath(
    localizedToInternalPath(requestPathname, locale),
  );

  const languages: Record<string, string> = {};

  for (const loc of locales) {
    languages[loc] = absoluteUrl(
      getPathname({ locale: loc, href: internalPath }),
    );
  }

  languages["x-default"] = absoluteUrl(
    getPathname({
      locale: defaultLocale,
      href: internalPath,
    }),
  );

  return {
    canonical: absoluteUrl(getPathname({ locale, href: internalPath })),
    languages,
  };
}
