"use client";

import { useRouter } from "@/i18n/routing";
import SkillModal from "./skill-modal";
import type { SkillDetailType } from "@/utils/interfaces/types";

export function SkillModalRoute({
  skillSlug,
  initialData,
}: {
  skillSlug: string;
  initialData: SkillDetailType;
}) {
  const router = useRouter();
  return (
    <SkillModal
      skillSlug={skillSlug}
      initialData={initialData}
      onClose={() => router.back()}
    />
  );
}
