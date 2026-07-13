import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface TimelineSkeletonProps {
  items?: number;
}

function TimelineItemSkeleton() {
  return (
    <li className="flex w-[17.5rem] max-w-[17.5rem] min-w-[17.5rem] shrink-0 flex-col">
      <div className="flex h-(--timeline-year-h) items-end justify-center px-1 pb-1">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex h-(--timeline-dot-row-h) items-center justify-center">
        <Skeleton className="size-8 rounded-full" />
      </div>
      <div className="bg-primary-500/20 mx-auto h-4 w-px" aria-hidden />
      <div className="space-y-2 px-1 pt-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </li>
  );
}

export const TimelineSkeleton: FC<TimelineSkeletonProps> = ({ items = 4 }) => {
  return (
    <ol className="timeline-horizontal-rail relative flex w-max min-w-full snap-x snap-mandatory gap-7 px-3">
      {Array.from({ length: items }, (_, index) => (
        <TimelineItemSkeleton key={index} />
      ))}
    </ol>
  );
};
