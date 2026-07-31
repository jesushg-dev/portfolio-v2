import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { type Locale } from "@/i18n/config";
import { buildLocaleAlternates } from "@/lib/seo/alternates";
import { buildSocialMetadata, SITE_NAME, SITE_URL } from "@/lib/seo/site";

export interface TranslatedMetadataConfig {
  namespace: string;
  titleKey?: string;
  descriptionKey?: string;
  /** Localized internal path, e.g. `/privacy` */
  pathname?: string;
}

interface NamespaceTranslator {
  has: (key: string) => boolean;
  (key: string): string;
}

async function getNamespaceTranslator(
  locale: Locale,
  namespace: string,
): Promise<NamespaceTranslator> {
  const loadTranslations = getTranslations as (opts: {
    locale: Locale;
    namespace: string;
  }) => Promise<NamespaceTranslator>;

  return loadTranslations({ locale, namespace });
}

function resolveCanonicalUrl(canonical: unknown): string | undefined {
  if (typeof canonical === "string") return canonical;
  if (canonical instanceof URL) return canonical.href;
  if (
    canonical &&
    typeof canonical === "object" &&
    "url" in canonical &&
    typeof canonical.url === "string"
  ) {
    return (canonical as { url: string }).url;
  }
  return undefined;
}

export async function createTranslatedMetadata(
  params: Promise<{ locale: string }>,
  config: TranslatedMetadataConfig,
): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as Locale;
  const t = await getNamespaceTranslator(appLocale, config.namespace);

  const titleCandidates = [config.titleKey, "metaTitle", "title"].filter(
    (key): key is string => Boolean(key),
  );

  let title = SITE_NAME;
  for (const key of titleCandidates) {
    if (t.has(key)) {
      title = t(key);
      break;
    }
  }

  const metadata: Metadata = { title };

  const descriptionCandidates = [
    config.descriptionKey,
    "metaDescription",
    "subtitle",
    "description",
  ].filter((key): key is string => Boolean(key));

  for (const key of descriptionCandidates) {
    if (t.has(key)) {
      metadata.description = t(key);
      break;
    }
  }

  if (config.pathname) {
    const alternates = buildLocaleAlternates(appLocale, config.pathname);
    metadata.alternates = alternates;

    const canonicalUrl =
      resolveCanonicalUrl(alternates.canonical) ??
      `${SITE_URL}${config.pathname}`;

    if (metadata.description) {
      Object.assign(
        metadata,
        buildSocialMetadata({
          title,
          description: String(metadata.description),
          url: canonicalUrl,
        }),
      );
    }
  }

  return metadata;
}
