import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "next-intl";

import { getSkillDetailCached } from "@/features/home/components/skills/get-skill-detail";

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

  return {
    title: t("page.metaTitle", { title: detail.title }),
    description: detail.description,
  };
}
