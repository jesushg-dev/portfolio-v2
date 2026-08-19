import { defineRouting } from "next-intl/routing";

import { locales, defaultLocale, pathnames } from "@/i18n/config";

export const localePrefix =
  process.env.NEXT_PUBLIC_LOCALE_PREFIX === "never" ? "never" : "as-needed";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix,
  pathnames,
});
