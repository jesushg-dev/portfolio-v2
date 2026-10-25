import { Skeleton } from "@/components/ui/skeleton";

export default function PublicPageLoading() {
  return (
    <div
      aria-busy="true"
      className="mx-auto w-full max-w-5xl space-y-8 px-4 pt-32 pb-20 sm:px-6"
    >
      <div className="space-y-4">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-full" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
