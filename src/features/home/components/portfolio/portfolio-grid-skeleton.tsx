import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface PortfolioGridSkeletonProps {
  count?: number;
}

function PortfolioCardSkeleton() {
  return (
    <div className="bg-card border-border/80 w-full overflow-hidden rounded-3xl border shadow-xs">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-6 w-2/3 rounded-md" />
          <div className="flex gap-1.5">
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Skeleton className="h-7 w-20 rounded-xl" />
          <Skeleton className="h-7 w-24 rounded-xl" />
          <Skeleton className="h-7 w-18 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export const PortfolioGridSkeleton: FC<PortfolioGridSkeletonProps> = ({
  count = 6,
}) => {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex justify-center">
          <PortfolioCardSkeleton />
        </li>
      ))}
    </ul>
  );
};
