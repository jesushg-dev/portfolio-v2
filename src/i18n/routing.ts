import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

import { locales, defaultLocale, pathnames } from "@/i18n/config";
export const localePrefix =
  process.env.NEXT_PUBLIC_LOCALE_PREFIX === "never" ? "never" : "as-needed";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,
  // Used when no locale matches
  defaultLocale,
  // Used to determine the locale prefix
  localePrefix,
  // The pathnames for each page
  pathnames,
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
