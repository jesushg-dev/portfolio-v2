import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface CvModalFormSkeletonProps {
  variant?: "header" | "about";
}

export const CvModalFormSkeleton: FC<CvModalFormSkeletonProps> = ({
  variant = "header",
}) => {
  if (variant === "about") {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-5 w-20" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
      <div className="flex justify-end border-t pt-4">
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
};
