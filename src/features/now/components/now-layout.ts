import { cn } from "@/lib/utils";

/** Match Uses / portfolio process shells — full width within page gutters. */
export function nowSectionClassName(muted = false) {
  return cn("px-4 sm:px-6 lg:px-20", muted && "bg-muted/50");
}

export const nowContainerClassName =
  "mx-auto w-full max-w-7xl xl:max-w-[90rem]";
