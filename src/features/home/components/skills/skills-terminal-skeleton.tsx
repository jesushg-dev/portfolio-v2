import type { FC } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const SkillsTerminalSkeleton: FC = () => {
  return (
    <div className="border-border/80 bg-card w-full overflow-hidden rounded-2xl border shadow-2xl">
      <div className="border-border/60 bg-muted/20 flex items-center gap-1.5 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-auto h-4 w-24">
          <Skeleton className="size-full" />
        </span>
      </div>
      <div className="divide-border/60 divide-y px-6 sm:px-8">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="grid gap-2.5 py-5 md:grid-cols-[12rem_1fr] md:gap-8"
          >
            <Skeleton className="h-5 w-24" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
