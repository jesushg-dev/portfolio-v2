import { SkillModalRoute } from "@/features/home/components/skills/skill-modal-route";
import { getSkillDetailCached } from "@/features/home/components/skills/get-skill-detail";
import { getPublicLocale } from "@/lib/public-site/locale";
import { notFound } from "next/navigation";

export { publicSkillParams as generateStaticParams } from "@/lib/public-site/static-params";

interface SkillModalRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: SkillModalRouteProps) {
  const { slug } = await params;
  const detail = await getSkillDetailCached(slug, await getPublicLocale());
  if (!detail) notFound();

  return <SkillModalRoute skillSlug={slug} initialData={detail} />;
}
