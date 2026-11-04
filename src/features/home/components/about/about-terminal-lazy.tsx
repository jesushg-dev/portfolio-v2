"use client";

import dynamic from "next/dynamic";

import type { TerminalDisplayDTO } from "@/features/terminal/lib/types";

import ViewportSection from "@/components/shared/viewport-section";

function AboutTerminalSkeleton() {
  return (
    <div
      aria-hidden
      className="bg-muted/60 h-[min(20rem,70vh)] w-full animate-pulse rounded-2xl"
    />
  );
}

const AboutTerminal = dynamic(() => import("./about-terminal"), {
  ssr: false,
  loading: AboutTerminalSkeleton,
});

interface AboutTerminalLazyProps {
  data: TerminalDisplayDTO | null;
}

export default function AboutTerminalLazy({ data }: AboutTerminalLazyProps) {
  return (
    <ViewportSection fallback={<AboutTerminalSkeleton />} minHeight="20rem">
      <AboutTerminal data={data} />
    </ViewportSection>
  );
}
