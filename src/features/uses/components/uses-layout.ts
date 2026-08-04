import { cn } from "@/lib/utils";

/** Shared shell — wide enough on desktop to avoid empty side gutters. */
export function usesSectionClassName(muted = false) {
  return cn("px-4 py-14 sm:px-6 md:py-16 lg:px-20", muted && "bg-muted/50");
}

export const usesContainerClassName =
  "mx-auto w-full max-w-7xl xl:max-w-[90rem]";
