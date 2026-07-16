"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { SoftSkillBentoItem } from "./soft-skills-bento";

const SoftSkillsBento = dynamic(() => import("./soft-skills-bento"), {
  ssr: false,
  loading: () => (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden
    >
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  ),
});

interface SoftSkillsBentoLazyProps {
  items: SoftSkillBentoItem[];
}

export default function SoftSkillsBentoLazy({
  items,
}: SoftSkillsBentoLazyProps) {
  return <SoftSkillsBento items={items} />;
}
