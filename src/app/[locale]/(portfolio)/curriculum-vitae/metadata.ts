import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "next-intl";

import { type Locale as AppLocale } from "@/i18n/config";
import { getLocalizedText } from "@/lib/i18n/localized";
import { buildLocaleAlternates } from "@/lib/seo/alternates";
import { buildSocialMetadata } from "@/lib/seo/site";
import { resolveTenant } from "@/lib/tenant/resolve";
import { db } from "@/server/db";

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

  if (tenant) {
    const [header, aboutMe] = await Promise.all([
      db.cvHeader.findUnique({ where: { userId: tenant.userId } }),
      db.cvAboutMe.findUnique({ where: { userId: tenant.userId } }),
    ]);

    if (header?.fullName) {
      title = `${header.fullName} - Curriculum Vitae`;
    }

    description = getLocalizedText(
      aboutMe?.aboutMe,
      locale as AppLocale,
      tenant.defaultLocale,
    );
  }

  const alternates = buildLocaleAlternates(appLocale, "/curriculum-vitae");
  const canonicalUrl =
    typeof alternates.canonical === "string"
      ? alternates.canonical
      : alternates.canonical instanceof URL
        ? alternates.canonical.href
        : "https://www.jesushg.com/curriculum-vitae";

  return {
    title,
    description: description || undefined,
    alternates,
    ...(description
      ? buildSocialMetadata({ title, description, url: canonicalUrl })
      : {}),
  };
}
