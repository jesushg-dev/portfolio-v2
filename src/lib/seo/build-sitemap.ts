import type { MetadataRoute } from "next";

import { defaultLocale, locales } from "@/i18n/config";
import { getPathname } from "@/i18n/routing";
import { PUBLIC_PAGE_LIVE } from "@/lib/public-preview-pages";
import { SITE_URL } from "@/lib/seo/site";

type StaticHref = Parameters<typeof getPathname>[0]["href"];

interface DynamicHref {
  pathname: "/projects/[slug]" | "/skills/[slug]";
  params: { slug: string };
}

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}

function buildLanguageAlternates(
  href: StaticHref | DynamicHref,
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = absoluteUrl(
      getPathname({ locale: locale, href: href }),
    );
  }

  languages["x-default"] = absoluteUrl(
    getPathname({ locale: defaultLocale, href: href }),
  );

  return languages;
}

interface SitemapEntryOptions {
  lastModified?: Date | string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
}

export function buildLocalizedSitemapEntry(
  href: StaticHref | DynamicHref,
  options: SitemapEntryOptions = {},
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(getPathname({ locale: defaultLocale, href: href })),
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: {
      languages: buildLanguageAlternates(href),
    },
  };
}

/** Indexable public routes (internal pathnames). Auth and admin are excluded. */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/schedule",
  "/curriculum-vitae",
  "/certificates",
  "/certificates/frontend",
  "/certificates/backend",
  "/certificates/cybersecurity",
  "/certificates/softskills",
  "/timeline",
  "/privacy",
  "/uses",
  "/now",
  "/colophon",
] as const satisfies readonly StaticHref[];

const SITEMAP_LIVE_FLAGS: Partial<
  Record<(typeof PUBLIC_SITEMAP_PATHS)[number], boolean>
> = {
  "/uses": PUBLIC_PAGE_LIVE.uses,
  "/now": PUBLIC_PAGE_LIVE.now,
  "/colophon": PUBLIC_PAGE_LIVE.colophon,
};

export const INDEXABLE_SITEMAP_PATHS = PUBLIC_SITEMAP_PATHS.filter(
  (pathname) => SITEMAP_LIVE_FLAGS[pathname] !== false,
);

export const PUBLIC_SITEMAP_PRIORITIES: Partial<
  Record<(typeof PUBLIC_SITEMAP_PATHS)[number], number>
> = {
  "/": 1,
  "/curriculum-vitae": 0.9,
  "/certificates": 0.8,
  "/timeline": 0.7,
  "/schedule": 0.6,
  "/uses": 0.6,
  "/now": 0.6,
  "/colophon": 0.4,
  "/privacy": 0.3,
};

export const PUBLIC_SITEMAP_CHANGE_FREQUENCY: Partial<
  Record<
    (typeof PUBLIC_SITEMAP_PATHS)[number],
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >
> = {
  "/": "weekly",
  "/curriculum-vitae": "monthly",
  "/certificates": "monthly",
  "/timeline": "monthly",
  "/schedule": "monthly",
  "/uses": "monthly",
  "/now": "weekly",
  "/colophon": "yearly",
  "/privacy": "yearly",
};
