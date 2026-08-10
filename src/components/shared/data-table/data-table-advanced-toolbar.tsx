"use client";

import type { ReactTable, RowData } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { cn } from "@/lib/utils";
import { type ComponentProps } from "react";

interface DataTableAdvancedToolbarProps<
  TData extends RowData,
> extends ComponentProps<"div"> {
  table: ReactTable<AppTableFeatures, TData>;
}

export function DataTableAdvancedToolbar<TData extends RowData>({
  table,
  children,
  className,
  ...props
}: DataTableAdvancedToolbarProps<TData>) {
  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
