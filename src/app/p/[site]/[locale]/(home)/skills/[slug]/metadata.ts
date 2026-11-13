import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "next-intl";

import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { getSkillDetailCached } from "@/features/home/components/skills/get-skill-detail";
import { SITE_NAME, TWITTER_HANDLE } from "@/lib/seo/site";

interface SkillDetailMetadataProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: SkillDetailMetadataProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "main.skills" });
  const detail = await getSkillDetailCached(slug, locale);

  if (!detail) {
    return { title: t("page.notFound") };
  }

  const title = t("page.metaTitle", { title: detail.title });
  const description = detail.description || undefined;
  const alternates = await buildPublicAlternates(locale, {
    pathname: "/skills/[slug]",
    params: { slug },
  });

  return {
    alternates,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: alternates.canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title,
      description,
      site: TWITTER_HANDLE,
    },
  };
}
