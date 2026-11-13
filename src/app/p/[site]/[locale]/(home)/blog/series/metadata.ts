import type { Metadata } from "next";
import { type Locale } from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { buildPublicAlternates } from "@/lib/public-site/metadata";

interface SeriesPageMetadataProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: SeriesPageMetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "main.blog" });

  return {
    title: `${t("seriesTitle")} · ${t("title")}`,
    description: t("seriesSubtitle"),
    alternates: await buildPublicAlternates(locale, "/blog/series"),
  };
}
