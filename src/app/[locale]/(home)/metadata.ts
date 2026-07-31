import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { type Locale as AppLocale } from "@/i18n/config";
import { getPathname } from "@/i18n/routing";
import { buildSocialMetadata, SITE_URL } from "@/lib/seo/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "main",
  });

  const title = t("meta.title");
  const description = t("meta.description");
  const pageUrl = new URL(
    getPathname({ locale: locale as AppLocale, href: "/" }),
    SITE_URL,
  ).href;

  return {
    title,
    description,
    keywords: t("meta.keywords"),
    ...buildSocialMetadata({ title, description, url: pageUrl }),
  };
}
