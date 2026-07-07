import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type CvListSkeletonProps = {
  items?: number;
  /** 1 = single line, 2 = title + subtitle (contacts, experiences, etc.) */
  lines?: 1 | 2;
};

function CvListItemSkeleton({ lines = 1 }: { lines?: 1 | 2 }) {
  return (
    <li className="bg-muted/40 flex items-start justify-between gap-3 rounded-lg px-4 py-3 shadow-sm">
      <div className="flex flex-1 items-start gap-3">
        <Skeleton className="mt-1 size-4 shrink-0 rounded-sm" />
        <div className="flex-1 space-y-2">
          {lines === 2 ? <Skeleton className="h-3 w-16" /> : null}
          <Skeleton
            className={`h-4 ${lines === 2 ? "w-48" : "w-full max-w-xs"}`}
          />
          {lines === 2 ? <Skeleton className="h-3 w-32" /> : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
      </div>
    </li>
  );
}

export const CvListSkeleton: FC<CvListSkeletonProps> = ({
  items = 3,
  lines = 1,
}) => {
  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-2">
        {Array.from({ length: items }, (_, index) => (
          <CvListItemSkeleton key={index} lines={lines} />
        ))}
      </ul>
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  );
};
