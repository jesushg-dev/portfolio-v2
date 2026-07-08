import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type PortfolioGridSkeletonProps = {
  count?: number;
};

function PortfolioCardSkeleton() {
  return (
    <div className="bg-background-50 mx-auto w-full max-w-sm overflow-hidden rounded-xl shadow-sm">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-2/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export const PortfolioGridSkeleton: FC<PortfolioGridSkeletonProps> = ({
  count = 6,
}) => {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex justify-center">
          <PortfolioCardSkeleton />
        </li>
      ))}
    </ul>
  );
};
