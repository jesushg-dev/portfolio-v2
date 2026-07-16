"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { ExperienceAccordion } from "./experience-accordion";

type ExperienceAccordionProps = ComponentProps<typeof ExperienceAccordion>;

const ExperienceAccordionInner = dynamic(
  () =>
    import("./experience-accordion").then((mod) => ({
      default: mod.ExperienceAccordion,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    ),
  },
);

export default function ExperienceAccordionLazy(
  props: ExperienceAccordionProps,
) {
  return <ExperienceAccordionInner {...props} />;
}
