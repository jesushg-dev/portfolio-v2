import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { getPathname } from "@/i18n/routing";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";
import { SITE_URL, buildSocialMetadata } from "@/lib/seo/site";
import {
  createTranslatedMetadata,
  type TranslatedMetadataConfig,
} from "@/lib/seo/create-translated-metadata";
import { resolvePublicTenant } from "./tenant";

type PublicHref = Parameters<typeof getPathname>[0]["href"];

export async function buildPublicAlternates(locale: Locale, href: PublicHref) {
  const tenant = await resolvePublicTenant();
  const origin = tenant
    ? getTenantPublicUrl({
        username: tenant.username,
        isPrimary: tenant.isPrimary,
        customDomain: null,
      })
    : SITE_URL;
  const url = (language: Locale) =>
    new URL(getPathname({ locale: language, href }), origin).href;
  const languages: Record<string, string> = {};
  for (const language of locales) {
    languages[language] = url(language);
  }
  languages["x-default"] = url(defaultLocale);
  return {
    canonical: url(locale),
    languages,
  };
}

export async function createPublicTranslatedMetadata(
  params: Promise<{ locale: string; slug?: string[] }>,
  config: TranslatedMetadataConfig,
): Promise<Metadata> {
  const metadata = await createTranslatedMetadata(params, config);
  if (config.pathname) {
    const { locale, slug } = await params;
    const pathname =
      config.pathname === "/certificates" &&
      slug?.[0] &&
      ["frontend", "backend", "cybersecurity", "softskills"].includes(slug[0])
        ? `/certificates/${slug[0]}`
        : config.pathname;
    const alternates = await buildPublicAlternates(
      locale as Locale,
      pathname as PublicHref,
    );
    metadata.alternates = alternates;
    if (
      typeof metadata.title === "string" &&
      typeof metadata.description === "string"
    ) {
      Object.assign(
        metadata,
        buildSocialMetadata({
          title: metadata.title,
          description: metadata.description,
          url: alternates.canonical,
        }),
      );
    }
  }
  return metadata;
}
