import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { type Locale as AppLocale } from "@/i18n/config";
import { getPathname } from "@/i18n/routing";
import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import { buildSocialMetadata, SITE_NAME, SITE_URL } from "@/lib/seo/site";
import {
  buildTenantDocumentTitle,
  shouldUseTenantDocumentTitle,
} from "@/lib/seo/tenant-document-title";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";
import {
  getPrimaryDomain,
  parseTenantSlug,
  requestHostFromHeaders,
} from "@/lib/tenant/parse-host";
import { resolveTenant } from "@/lib/tenant/resolve";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "main",
  });

  const hostSlug = parseTenantSlug(
    requestHostFromHeaders(await headers()),
    getPrimaryDomain(),
  );
  const tenant = await resolveTenant();

  let title = t("meta.title");
  let description = t("meta.description");
  let keywords: string | undefined = t("meta.keywords");
  let siteName = SITE_NAME;
  let pageUrl = new URL(getPathname({ locale: appLocale, href: "/" }), SITE_URL)
    .href;

  if (shouldUseTenantDocumentTitle(hostSlug, tenant?.isPrimary)) {
    const hero = await getCachedHeroPublic(appLocale);
    const fullName = hero?.fullName?.trim();
    const ownerName =
      (fullName && fullName.length > 0 ? fullName : undefined) ??
      tenant?.username ??
      hostSlug ??
      siteName;
    title = buildTenantDocumentTitle(ownerName, hero?.heroSubtitle);
    const summary = hero?.heroSummary?.trim();
    const tagline = hero?.heroTagline?.trim();
    description =
      (summary && summary.length > 0 ? summary : undefined) ??
      (tagline && tagline.length > 0 ? tagline : undefined) ??
      description;
    keywords = undefined;
    siteName = ownerName;

    if (tenant) {
      pageUrl = `${getTenantPublicUrl({
        username: tenant.username,
        isPrimary: tenant.isPrimary,
        customDomain: null,
      })}${getPathname({ locale: appLocale, href: "/" })}`;
    }
  }

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    ...buildSocialMetadata({
      title,
      description,
      url: pageUrl,
      siteName,
    }),
  };
}
