"use client";

import dynamic from "next/dynamic";

import type { TerminalDisplayDTO } from "@/features/terminal/lib/types";

import AboutTerminalEmpty from "./about-terminal-empty";

const AboutTerminal = dynamic(() => import("./about-terminal"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="bg-background-100/80 h-[min(24rem,70vh)] w-full animate-pulse rounded-xl"
    />
  ),
});

interface AboutTerminalLazyProps {
  data: TerminalDisplayDTO | null;
}

export default function AboutTerminalLazy({ data }: AboutTerminalLazyProps) {
  if (!data) {
    return <AboutTerminalEmpty />;
  }

  return <AboutTerminal data={data} />;
}
