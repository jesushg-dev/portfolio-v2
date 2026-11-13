import type { Metadata } from "next";
import { type Locale } from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { buildPublicAlternates } from "@/lib/public-site/metadata";

interface TagMetadataProps {
  params: Promise<{
    locale: Locale;
    tag: string;
  }>;
}

export async function generateMetadata({
  params,
}: TagMetadataProps): Promise<Metadata> {
  const { locale, tag } = await params;
  const decoded = decodeURIComponent(tag);
  const t = await getTranslations({ locale, namespace: "main.blog" });

  const title = `#${decoded} · ${t("title")}`;
  const description = t("taggedWith", { tag: decoded });
  const alternates = await buildPublicAlternates(locale, {
    pathname: "/blog/tag/[tag]",
    params: { tag: decoded },
  });

  return {
    title,
    description,
    alternates,
  };
}
