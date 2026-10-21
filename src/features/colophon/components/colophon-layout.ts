import { cn } from "@/lib/utils";

/** Match Uses / Now — full width within page gutters. */
export function colophonSectionClassName(flushTop = false) {
  return cn("px-4 sm:px-6 lg:px-20", flushTop ? "pt-0" : "mt-24");
}

export const colophonContainerClassName =
  "mx-auto w-full max-w-7xl xl:max-w-[90rem]";
