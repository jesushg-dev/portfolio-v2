import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProcessPagesLoading() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0 space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <DataTableSkeleton columnCount={4} rowCount={6} />
    </div>
  );
}
