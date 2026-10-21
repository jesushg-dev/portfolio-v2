import { cn } from "@/lib/utils";

/** Shared Shield-friendly interactive sizing (44px min target). */
export const processInteractiveStyles =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors focus-visible:ring-ring/35 focus-visible:ring-2 focus-visible:outline-none";

export const processTextLinkStyles =
  "inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold transition-colors focus-visible:ring-ring/35 focus-visible:ring-2 focus-visible:outline-none";

export const processEyebrowStyles =
  "text-primary-900 text-sm font-semibold tracking-widest uppercase";

export function processSectionHeadingId(sectionId: string) {
  return `${sectionId}-heading`;
}

export const processDarkBandClass =
  "bg-slate-950 text-slate-100 ring-1 ring-white/10";

export const processDarkBandMutedTextClass = "text-slate-200";

export function processPanelId(sectionId: string, index: number) {
  return `${sectionId}-panel-${index}`;
}

export function processMotionCollapseClass(isOpen: boolean) {
  return cn(
    "grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-in-out",
    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
  );
}
