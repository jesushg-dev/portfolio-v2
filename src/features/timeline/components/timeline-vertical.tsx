import type { FC } from "react";
import Image from "next/image";

import { Timeline } from "@/components/ui/timeline";
import type { TimelinePublicItem } from "@/features/timeline/lib/map-timeline-public";
import { groupTimelineByYear } from "@/features/timeline/lib/map-timeline-public";

interface TimelineVerticalProps {
  items: TimelinePublicItem[];
}

function TimelineEntryContent({ item }: { item: TimelinePublicItem }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-primaryText-200 text-lg font-semibold">
          {item.title}
        </p>
        {item.location ? (
          <p className="text-primaryText-800 text-sm">{item.location}</p>
        ) : null}
      </div>

      {item.description ? (
        <p className="text-primaryText-500 text-sm leading-relaxed md:text-base">
          {item.description}
        </p>
      ) : null}

      {item.images.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {item.images.map((image) => (
            <div
              key={image}
              className="bg-background-100 relative aspect-video overflow-hidden rounded-lg"
            >
              <Image
                src={image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                unoptimized
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const TimelineVertical: FC<TimelineVerticalProps> = ({ items }) => {
  if (items.length === 0) {
    return null;
  }

  const yearGroups = groupTimelineByYear(items);

  const data = yearGroups.flatMap((group) =>
    group.items.map((item, index) => ({
      title: index === 0 ? String(group.year) : "",
      content: <TimelineEntryContent item={item} />,
    })),
  );

  return <Timeline data={data} />;
};
