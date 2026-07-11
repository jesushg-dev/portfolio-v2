import type { RouterOutputs } from "@/trpc/react";

export type TimelineAdminItem =
  RouterOutputs["timelineAdmin"]["getMine"][number];

export function readTimelineImages(item: TimelineAdminItem): string[] {
  return item.images ?? [];
}
