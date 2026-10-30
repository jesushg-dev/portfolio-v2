import type { MetadataRoute } from "next";

import { defaultLocale, locales } from "@/i18n/config";
import { getPathname } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/site";

type StaticHref = Parameters<typeof getPathname>[0]["href"];

interface DynamicHref {
  pathname: "/projects/[slug]" | "/skills/[slug]" | "/process/[slug]";
  params: { slug: string };
}

function absoluteUrl(path: string, origin: string): string {
  return new URL(path, origin).href;
}

function buildLanguageAlternates(
  href: StaticHref | DynamicHref,
  origin: string,
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = absoluteUrl(
      getPathname({ locale: locale, href: href }),
      origin,
    );
  }

  languages["x-default"] = absoluteUrl(
    getPathname({ locale: defaultLocale, href: href }),
    origin,
  );

  return languages;
}

interface SitemapEntryOptions {
  origin?: string;
  lastModified?: Date | string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
}

export function buildLocalizedSitemapEntries(
  href: StaticHref | DynamicHref,
  options: SitemapEntryOptions = {},
): MetadataRoute.Sitemap {
  const languages = buildLanguageAlternates(href, options.origin ?? SITE_URL);
  const urls = new Set(locales.map((locale) => languages[locale]));

  return Array.from(urls, (url) => ({
    url,
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: {
      languages,
    },
  }));
}

/** Indexable public routes (internal pathnames). Auth and admin are excluded. */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/schedule",
  "/curriculum-vitae",
  "/projects",
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
  "/stats",
] as const satisfies readonly StaticHref[];

export const INDEXABLE_SITEMAP_PATHS = PUBLIC_SITEMAP_PATHS.filter(
  (
    pathname,
  ): pathname is Exclude<(typeof PUBLIC_SITEMAP_PATHS)[number], "/uses"> =>
    pathname !== "/uses",
);

export const PUBLIC_SITEMAP_PRIORITIES: Partial<
  Record<(typeof PUBLIC_SITEMAP_PATHS)[number], number>
> = {
  "/": 1,
  "/curriculum-vitae": 0.9,
  "/projects": 0.8,
  "/certificates": 0.8,
  "/timeline": 0.7,
  "/schedule": 0.6,
  "/uses": 0.6,
  "/now": 0.6,
  "/colophon": 0.4,
  "/stats": 0.5,
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
  "/projects": "weekly",
  "/certificates": "monthly",
  "/timeline": "monthly",
  "/schedule": "monthly",
  "/uses": "monthly",
  "/now": "weekly",
  "/colophon": "yearly",
  "/stats": "weekly",
  "/privacy": "yearly",
};
