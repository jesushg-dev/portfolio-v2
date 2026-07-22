"use client";

import { use } from "react";
import { useRouter } from "next/navigation";

import SkillModal from "@/features/home/components/skills/skill-modal";

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
