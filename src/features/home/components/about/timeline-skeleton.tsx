import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type TimelineSkeletonProps = {
  items?: number;
};

function TimelineItemSkeleton() {
  return (
    <li className="relative w-full space-y-2 pb-6 pl-4">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full max-w-sm" />
      <Skeleton className="h-4 w-4/5 max-w-sm" />
    </li>
  );
}

export const TimelineSkeleton: FC<TimelineSkeletonProps> = ({ items = 4 }) => {
  return (
    <>
      {Array.from({ length: items }, (_, index) => (
        <TimelineItemSkeleton key={index} />
      ))}
    </>
  );
};
