"use client";

import { useRouter } from "@/i18n/routing";
import SkillModal from "./skill-modal";
import type { SkillDetailType } from "@/utils/interfaces/types";
import { TRPCReactProvider } from "@/trpc/react";

export function SkillModalRoute({
  skillSlug,
  initialData,
}: {
  skillSlug: string;
  initialData: SkillDetailType;
}) {
  const router = useRouter();
  return (
    <TRPCReactProvider>
      <SkillModal
        skillSlug={skillSlug}
        initialData={initialData}
        onClose={() => router.back()}
      />
    </TRPCReactProvider>
  );
}
