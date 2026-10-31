import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "next-intl";

import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { buildSocialMetadata } from "@/lib/seo/site";
import { resolveTenant } from "@/lib/tenant/resolve";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";
import { getPublicCvPageData } from "@/features/cv/lib/get-public-cv-page-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as Locale;
  const t = await getTranslations({
    locale: appLocale,
    namespace: "curriculum",
  });

  const tenant = await resolveTenant();
  let title = t("title");
  let description = "";

  if (tenant && !isPublicCvVisible(tenant)) {
    return {
      title: t("unpublished.title"),
      description: t("unpublished.description"),
      robots: { index: false, follow: true },
    };
  }

  if (tenant) {
    const [appLanguages, , header, aboutMe] = await getPublicCvPageData(
      tenant.userId,
      false,
    );

    if (header?.fullName) {
      title = `${header.fullName} - Curriculum Vitae`;
    }

    const field = createLocalizedFieldResolver(appLanguages, locale);
    description = field(aboutMe?.translations, "aboutMe");
  }

  const alternates = await buildPublicAlternates(
    appLocale,
    "/curriculum-vitae",
  );
  const canonicalUrl = alternates.canonical;

  return {
    title,
    description: description || undefined,
    alternates,
    ...(description
      ? buildSocialMetadata({ title, description, url: canonicalUrl })
      : {}),
  };
}
