import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { isPublicPageLive } from "@/lib/public-preview-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  if (!isPublicPageLive("now")) notFound();

  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "main.now",
  });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
