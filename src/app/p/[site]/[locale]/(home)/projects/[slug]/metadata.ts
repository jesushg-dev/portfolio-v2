import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { type Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { SITE_NAME, TWITTER_HANDLE } from "@/lib/seo/site";

interface ProjectMetadataProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProjectMetadataProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "main.portfolio" });
  const project = await api.portfolio.getProjectBySlug({ slug, locale });

  if (!project) {
    return { title: t("private.title") };
  }

  const title = project.title?.trim() || t("private.title");
  const fullTitle = `${title} · ${t("subtitle")}`;
  const description = project.description || undefined;
  const alternates = await buildPublicAlternates(locale, {
    pathname: "/projects/[slug]",
    params: { slug },
  });

  const ogImages = project.image
    ? [{ url: project.image, alt: title }]
    : undefined;

  return {
    alternates,
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      url: alternates.canonical,
      siteName: SITE_NAME,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      site: TWITTER_HANDLE,
      images: project.image ? [project.image] : undefined,
    },
  };
}
