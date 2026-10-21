import type { Metadata } from "next";

import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { getPathname } from "@/i18n/routing";
import { processPageHref } from "@/lib/process-pages/process-page-href";
import { SITE_URL } from "@/lib/seo/site";
import { api } from "@/trpc/server";

interface ProcessPageMetadataProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}

export async function generateMetadata({
  params,
}: ProcessPageMetadataProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await api.processPages.getBySlug({ slug, locale });

  if (!page) {
    return {};
  }

  const href = processPageHref(slug);
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = absoluteUrl(getPathname({ locale: loc, href }));
  }
  languages["x-default"] = absoluteUrl(
    getPathname({ locale: defaultLocale, href }),
  );

  return {
    title: page.metaTitle || page.heroTitle || page.menuTitle,
    description: page.metaDescription || undefined,
    alternates: {
      canonical: absoluteUrl(getPathname({ locale, href })),
      languages,
    },
  };
}
