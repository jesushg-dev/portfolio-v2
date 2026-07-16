import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export const SkillsTerminalSkeleton: FC = () => {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-4 px-6 py-5 sm:px-7 sm:py-6">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="inline-flex items-center gap-2">
          <Skeleton className="h-[17px] w-[17px] rounded-sm" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  );
};
