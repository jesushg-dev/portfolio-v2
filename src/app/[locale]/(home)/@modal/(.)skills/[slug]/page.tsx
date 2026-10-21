"use client";

import { use } from "react";

import SkillModal from "@/features/home/components/skills/skill-modal";
import { useRouter } from "@/i18n/routing";

interface SkillModalRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function SkillModalRoute({ params }: SkillModalRouteProps) {
  const router = useRouter();
  const { slug } = use(params);

  return <SkillModal skillSlug={slug} onClose={() => router.back()} />;
}
