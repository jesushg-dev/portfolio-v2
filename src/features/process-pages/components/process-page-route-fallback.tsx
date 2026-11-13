import { Skeleton } from "@/components/ui/skeleton";

function ProcessNavSkeleton() {
  return (
    <nav
      aria-hidden="true"
      className="fixed top-1/2 left-10 z-20 hidden w-44 -translate-y-1/2 2xl:block"
    >
      <Skeleton className="mb-4 h-3.5 w-24 rounded" />
      <div className="space-y-2 border-border/60 border-l-2 pl-4">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
    </nav>
  );
}

function ProcessHeroSkeleton() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_60%_at_30%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)] pt-28 pb-20 md:pt-36 md:pb-24">
      <div className="mx-auto grid w-full items-center gap-12 px-4 sm:px-6 lg:container lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:px-20">
        <div>
          {/* Eyebrow badge */}
          <Skeleton className="mb-4 h-6 w-32 rounded-full" />

          {/* Title & subtitle lines */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-full max-w-lg rounded-lg sm:h-12 lg:h-14" />
            <Skeleton className="h-10 w-3/4 max-w-md rounded-lg sm:h-12 lg:h-14" />
          </div>

          <div className="mt-6 max-w-xl space-y-2">
            <Skeleton className="h-5 w-full rounded" />
            <Skeleton className="h-5 w-4/5 rounded" />
          </div>

          {/* CTA buttons */}
          <div className="mt-9 flex flex-wrap gap-3">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
        </div>

        {/* Terminal/visual box placeholder */}
        <div className="border-border/80 bg-card/60 rounded-2xl border p-6 shadow-xs backdrop-blur-xs">
          <div className="border-border/60 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3 rounded-full" />
              <Skeleton className="size-3 rounded-full" />
              <Skeleton className="size-3 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </section>
  );
}

const BENEFIT_SKELETON_ITEMS = [1, 2, 3];

function ProcessBenefitsSkeleton() {
  return (
    <section className="border-border/80 border-t py-20 md:py-28">
      <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
        <div className="mx-auto mb-16 max-w-2xl text-center md:mb-18">
          <Skeleton className="mx-auto mb-3 h-4 w-28 rounded-full" />
          <Skeleton className="mx-auto h-8 w-64 rounded-lg sm:h-10" />
          <Skeleton className="mx-auto mt-4 h-4 w-full max-w-md rounded" />
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-3">
          {BENEFIT_SKELETON_ITEMS.map((key) => (
            <div key={key} className="border-border/80 border-t pt-5">
              <Skeleton className="mb-3 size-8 rounded-lg" />
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="mt-2.5 h-4 w-full rounded" />
              <Skeleton className="mt-1.5 h-4 w-4/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TIMELINE_SKELETON_STEPS = [1, 2, 3];

function ProcessTimelineSkeleton() {
  return (
    <section className="border-border/80 border-t py-20 md:py-28">
      <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
        <div className="mx-auto mb-16 max-w-2xl text-center md:mb-18">
          <Skeleton className="mx-auto mb-3 h-4 w-24 rounded-full" />
          <Skeleton className="mx-auto h-8 w-72 rounded-lg sm:h-10" />
          <Skeleton className="mx-auto mt-4 h-4 w-full max-w-lg rounded" />
        </div>

        <div className="border-border/80 divide-border/80 mx-auto max-w-3xl divide-y border-t border-b">
          {TIMELINE_SKELETON_STEPS.map((step) => (
            <div key={step} className="flex items-start gap-6 py-7">
              <Skeleton className="h-5 w-7 shrink-0 rounded" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-6 w-1/2 rounded sm:w-1/3" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessCtaSkeleton() {
  return (
    <section className="border-border/80 border-t bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_70%)] px-6 py-28 text-center">
      <div className="mx-auto max-w-3xl">
        <Skeleton className="mx-auto h-10 w-full max-w-xl rounded-lg sm:h-12" />
        <Skeleton className="mx-auto mt-4 mb-8 h-5 w-full max-w-lg rounded" />
        <Skeleton className="mx-auto h-11 w-44 rounded-full" />
      </div>
    </section>
  );
}

export function ProcessPageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading process page"
      className="bg-background text-foreground relative min-h-screen"
    >
      <span className="sr-only">Loading process page...</span>
      <ProcessNavSkeleton />
      <ProcessHeroSkeleton />
      <ProcessBenefitsSkeleton />
      <ProcessTimelineSkeleton />
      <ProcessCtaSkeleton />
    </div>
  );
}

export const ProcessPageRouteFallback = ProcessPageSkeleton;
