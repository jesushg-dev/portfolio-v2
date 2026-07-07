import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

function StepCardSkeleton() {
  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3 w-full max-w-md" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export const ConsoleFormSkeleton: FC = () => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="bg-muted/30 border-border/50 mb-6 flex items-center gap-3 rounded-lg border p-2">
        <div className="flex items-center gap-2 px-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-1">
          <section className="space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-6">
            <div className="space-y-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
            <div className="flex flex-col gap-4">
              <StepCardSkeleton />
              <StepCardSkeleton />
            </div>
            <Skeleton className="h-9 w-32 rounded-md" />
          </section>
        </div>
      </div>

      <div className="border-border mt-6 flex justify-end border-t pt-4">
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
    </div>
  );
};
