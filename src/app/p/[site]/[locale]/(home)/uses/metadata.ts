import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { buildPublicAlternates } from "@/lib/public-site/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "main.uses",
  });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: await buildPublicAlternates(locale as Locale, "/uses"),
  };
}
