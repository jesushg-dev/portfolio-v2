import type { TimelineItem } from "@prisma/client";

import type { RouterOutputs } from "@/trpc/react";

export type TimelineAdminItem =
  RouterOutputs["timelineAdmin"]["getMine"][number];

export type TimelineAdminItemRow = TimelineAdminItem &
  Pick<TimelineItem, "images">;

export function readTimelineImages(item: TimelineAdminItem): string[] {
  const images = (item as TimelineAdminItemRow).images;
  return Array.isArray(images) ? images : [];
}
