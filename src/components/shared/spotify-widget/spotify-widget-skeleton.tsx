import type { FC } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const SpotifyWidgetSkeleton: FC = () => {
  return (
    <article
      data-testid="spotify-widget-skeleton"
      className="flex w-full items-center gap-3 overflow-hidden rounded-md bg-[#191414] p-3"
    >
      <Skeleton className="size-[5.5rem] shrink-0 rounded-[4px] bg-white/10" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5 rounded-full bg-white/10" />
        <Skeleton className="h-3 w-3/5 rounded-full bg-white/10" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-1 flex-1 rounded-full bg-white/10" />
          <Skeleton className="h-2.5 w-8 rounded-full bg-white/10" />
        </div>
      </div>
      <Skeleton className="size-9 shrink-0 rounded-full bg-white/10" />
    </article>
  );
};

export default SpotifyWidgetSkeleton;
