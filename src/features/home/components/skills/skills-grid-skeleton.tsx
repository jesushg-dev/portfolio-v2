import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type SkillsGridSkeletonProps = {
  count?: number;
};

function SkillCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg p-4">
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export const SkillsGridSkeleton: FC<SkillsGridSkeletonProps> = ({
  count = 8,
}) => {
  return (
    <ul className="grid grid-cols-(--grid-cols-skills) gap-4">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex">
          <SkillCardSkeleton />
        </li>
      ))}
    </ul>
  );
};
