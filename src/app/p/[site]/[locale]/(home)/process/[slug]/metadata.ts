import type { Metadata } from "next";

import type { Locale } from "@/i18n/config";
import { processPageHref } from "@/lib/process-pages/process-page-href";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
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
  const page = await api.processPages.getBySlug({ slug, locale });

  if (!page) {
    return {};
  }

  const href = processPageHref(slug);

  return {
    title: page.metaTitle || page.heroTitle || page.menuTitle,
    description: page.metaDescription || undefined,
    alternates: await buildPublicAlternates(locale, href),
  };
}
