import type { Metadata } from "next";
import { type Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { SITE_NAME, TWITTER_HANDLE } from "@/lib/seo/site";

interface SeriesDetailMetadataProps {
  params: Promise<{
    locale: Locale;
    series: string;
  }>;
}

export async function generateMetadata({
  params,
}: SeriesDetailMetadataProps): Promise<Metadata> {
  const { locale, series } = await params;
  const decoded = decodeURIComponent(series);
  const seriesMeta = await api.blog.getSeriesBySlug({
    slug: decoded,
    locale,
  });

  const title = seriesMeta?.title ?? decoded;
  const description =
    seriesMeta?.description ?? `Read all articles in the ${title} series.`;
  const alternates = await buildPublicAlternates(locale, {
    pathname: "/blog/series/[series]",
    params: { series: decoded },
  });

  const ogImages = seriesMeta?.coverImage
    ? [{ url: seriesMeta.coverImage, alt: title }]
    : undefined;

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
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: TWITTER_HANDLE,
      images: seriesMeta?.coverImage ? [seriesMeta.coverImage] : undefined,
    },
  };
}
