import { defaultLocale, locales, pathnames, type Locale } from "@/i18n/config";
import { localePrefix } from "@/i18n/routing-config";
import { stripLocalePrefix } from "@/lib/i18n-path";

const LOCALE_PREFIX_RE = /^\/(en|es|nl)(?=\/|$)/;

/** Former next-intl pathnames for the two seeded process pages. */
export const LEGACY_PROCESS_PAGE_PATHS = [
  {
    slug: "how-i-use-ai",
    paths: {
      en: "/how-i-use-ai",
      es: "/como-uso-ia",
      nl: "/hoe-ik-ai-gebruik",
    },
  },
  {
    slug: "qa-collaboration",
    paths: {
      en: "/qa-collaboration",
      es: "/colaboracion-qa",
      nl: "/qa-samenwerking",
    },
  },
] as const satisfies readonly {
  slug: string;
  paths: Record<Locale, string>;
}[];

function localeFromPrefix(pathname: string): Locale | undefined {
  const match = LOCALE_PREFIX_RE.exec(pathname);
  if (!match) return undefined;
  return locales.find((locale) => locale === match[1]);
}

function localeFromLegacyPath(strippedPath: string, slug: string): Locale {
  const entry = LEGACY_PROCESS_PAGE_PATHS.find((item) => item.slug === slug);
  if (!entry) return defaultLocale;
  const matched = locales.find(
    (locale) => entry.paths[locale] === strippedPath,
  );
  return matched ?? defaultLocale;
}

function withLocalePrefix(locale: Locale, pathname: string): string {
  if (localePrefix === "never") return pathname;
  if (localePrefix === "as-needed" && locale === defaultLocale) return pathname;
  return `/${locale}${pathname}`;
}

export function localizedProcessPagePath(locale: Locale, slug: string): string {
  const templates = pathnames["/process/[slug]"];
  const template =
    typeof templates === "string" ? templates : templates[locale];
  return withLocalePrefix(locale, template.replace("[slug]", slug));
}

export function matchLegacyProcessPageRedirect(
  pathname: string,
): string | null {
  const stripped = stripLocalePrefix(pathname);
  const entry = LEGACY_PROCESS_PAGE_PATHS.find((item) =>
    (Object.values(item.paths) as string[]).includes(stripped),
  );
  if (!entry) return null;

  const locale =
    localeFromPrefix(pathname) ?? localeFromLegacyPath(stripped, entry.slug);

  return localizedProcessPagePath(locale, entry.slug);
}
