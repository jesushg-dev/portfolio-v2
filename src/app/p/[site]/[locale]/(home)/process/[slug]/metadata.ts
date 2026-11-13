import type { Metadata } from "next";

import { locales, type Locale } from "@/i18n/config";
import { processPageHref } from "@/lib/process-pages/process-page-href";
import { getPublicLocale } from "@/lib/public-site/locale";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { SITE_NAME, SITE_URL, TWITTER_HANDLE } from "@/lib/seo/site";
import { api } from "@/trpc/server";

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
  const activeLocale = locales.includes(locale)
    ? locale
    : await getPublicLocale();
  const page = await api.processPages.getBySlug({ slug, locale: activeLocale });

  if (!page) {
    return {};
  }

  const href = processPageHref(slug);
  const title = page.metaTitle || page.heroTitle || page.menuTitle;
  const description = page.metaDescription || page.heroDescription || undefined;
  const alternates = await buildPublicAlternates(activeLocale, href);

  const previewImage =
    slug === "how-i-use-ai" || slug === "qa-collaboration"
      ? `${SITE_URL}/previews/process-${slug}.webp`
      : undefined;

  const ogImages = previewImage
    ? [
        {
          url: previewImage,
          alt: title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "article",
      url: alternates.canonical,
      siteName: SITE_NAME,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: TWITTER_HANDLE,
      images: previewImage ? [previewImage] : undefined,
    },
  };
}
