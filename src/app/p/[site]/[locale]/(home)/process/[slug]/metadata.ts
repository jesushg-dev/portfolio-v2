import type { Metadata } from "next";

import type { Locale } from "@/i18n/config";
import { processPageHref } from "@/lib/process-pages/process-page-href";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { api } from "@/trpc/server";
import { SITE_NAME, TWITTER_HANDLE } from "@/lib/seo/site";

interface ProcessPageMetadataProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
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
  const title = page.metaTitle || page.heroTitle || page.menuTitle;
  const description = page.metaDescription || undefined;
  const alternates = await buildPublicAlternates(locale, href);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      url: alternates.canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: TWITTER_HANDLE,
    },
  };
}
