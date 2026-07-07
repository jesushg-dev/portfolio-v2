import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type PortfolioGridSkeletonProps = {
  count?: number;
};

function PortfolioCardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <Skeleton className="h-96 w-full rounded-md" />
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
