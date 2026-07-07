import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

function SectionBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-xl border border-transparent p-2">
      <Skeleton className="h-5 w-28" />
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            className={`h-3 ${index === lines - 1 ? "w-4/5" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}

export const CvEditorSkeleton: FC = () => {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="bg-card/95 mb-6 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="bg-muted/50 inline-flex rounded-lg p-0.5">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-3 w-14" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-10 rounded-md" />
              <Skeleton className="h-8 w-10 rounded-md" />
              <Skeleton className="h-8 w-10 rounded-md" />
            </div>
          </div>
        </div>

        <nav className="mt-3 flex gap-1 overflow-x-auto pt-3">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="h-7 w-20 shrink-0 rounded-md" />
          ))}
        </nav>
      </div>

      <div className="border-border overflow-hidden rounded-xl border shadow-sm">
        <Skeleton className="h-9 w-full rounded-none" />

        <div className="bg-muted/30 flex flex-row items-center justify-between border-b px-8 py-6">
          <div className="space-y-3">
            <Skeleton className="h-9 w-64 max-w-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="size-24 rounded-full" />
        </div>

        <div className="bg-card grid grid-cols-1 p-5 pb-10 sm:grid-cols-9">
          <div className="flex flex-col gap-6 sm:col-span-3">
            <SectionBlockSkeleton lines={4} />
            <SectionBlockSkeleton lines={3} />
            <SectionBlockSkeleton lines={2} />
            <SectionBlockSkeleton lines={5} />
          </div>

          <div className="col-span-1 hidden w-full justify-center sm:flex">
            <Skeleton className="h-full w-px" />
          </div>

          <div className="flex flex-col gap-6 sm:col-span-5">
            <SectionBlockSkeleton lines={4} />
            <SectionBlockSkeleton lines={6} />
            <SectionBlockSkeleton lines={3} />
            <SectionBlockSkeleton lines={2} />
          </div>
        </div>
      </div>
    </div>
  );
};
