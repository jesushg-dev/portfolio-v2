"use client";

import dynamic from "next/dynamic";

/** Skeleton shown while the globe/D3 bundle loads. */
function GlobeMapSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full w-full animate-pulse items-center justify-center rounded-xl border border-border/50 bg-card/40"
    >
      <div className="h-48 w-48 rounded-full bg-muted/60" />
    </div>
  );
}

const GlobeMapLazy = dynamic(
  () => import("./globe-map").then((m) => ({ default: m.GlobeMap })),
  {
    ssr: false,
    loading: GlobeMapSkeleton,
  },
);

export default GlobeMapLazy;
