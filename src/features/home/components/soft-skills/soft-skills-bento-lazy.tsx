"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { SoftSkillBentoItem, SoftSkillMetric } from "./soft-skills-bento";

const SoftSkillsBento = dynamic(() => import("./soft-skills-bento"), {
  ssr: false,
  loading: () => (
    <div
      className="grid w-full gap-12 lg:grid-cols-[5fr_7fr] lg:gap-14"
      aria-hidden
    >
      <div className="space-y-4">
        <Skeleton className="h-6 w-28 rounded-md" />
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-16 w-full max-w-md rounded-lg" />
        <div className="mt-10 grid grid-cols-2 gap-4 border-t pt-6">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
      </div>
    </div>
  ),
});

interface SoftSkillsBentoLazyProps {
  items: SoftSkillBentoItem[];
  metrics?: SoftSkillMetric[];
}

export default function SoftSkillsBentoLazy({
  items,
  metrics,
}: SoftSkillsBentoLazyProps) {
  return <SoftSkillsBento items={items} metrics={metrics} />;
}
