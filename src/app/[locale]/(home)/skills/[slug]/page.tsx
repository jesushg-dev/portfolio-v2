import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";

import { getSkillDetailCached } from "@/features/home/components/skills/get-skill-detail";
import { SkillDetailPageView } from "@/features/home/components/skills/skill-detail-page-view";

import { generateMetadata } from "./metadata";

export { generateMetadata };

interface SkillDetailPageProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export default async function SkillDetailPage({
  params,
}: SkillDetailPageProps) {
  const { locale, slug } = await params;

  const detail = await getSkillDetailCached(slug, locale);
  if (!detail) notFound();

  return (
    <section className="bg-background-50 min-h-screen pt-24 pb-4">
      <SkillDetailPageView detail={detail} />
    </section>
  );
}
