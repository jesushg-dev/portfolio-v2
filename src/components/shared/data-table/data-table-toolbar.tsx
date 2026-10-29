"use client";

import type {
  Column,
  ColumnFiltersState,
  ReactTable,
  RowData,
} from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { X } from "lucide-react";
import { DataTableDateFilter } from "@/components/shared/data-table/data-table-date-filter";
import { DataTableFacetedFilter } from "@/components/shared/data-table/data-table-faceted-filter";
import { DataTableSliderFilter } from "@/components/shared/data-table/data-table-slider-filter";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import {
  DataTableSearchDialog,
  type DataTableSearchProps,
} from "@/components/shared/data-table/data-table-search-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type ComponentProps, useCallback, useMemo } from "react";

interface DataTableToolbarProps<
  TData extends RowData,
> extends ComponentProps<"div"> {
  table: ReactTable<AppTableFeatures, TData>;
  search?: DataTableSearchProps;
}

export function DataTableToolbar<TData extends RowData>({
  table,
  search,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const columns = useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            column.getCanFilter() &&
            (!search || column.columnDef.meta?.variant !== "text"),
        ),
    [table, search],
  );

  const onReset = useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full min-w-0 flex-col items-stretch justify-between gap-3 p-1 md:flex-row md:items-start",
        search && "flex-row flex-wrap items-center",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-wrap items-center gap-2",
          search && "min-w-fit",
        )}
      >
        {search ? <DataTableSearchDialog {...search} /> : null}
        {columns.length > 0 ? (
          <table.Subscribe selector={(state) => state.columnFilters}>
            {(columnFilters) => (
              <DataTableToolbarFilters
                columnFilters={columnFilters}
                columns={columns}
                onReset={onReset}
              />
            )}
          </table.Subscribe>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

interface DataTableToolbarFiltersProps<TData extends RowData> {
  columnFilters: ColumnFiltersState;
  columns: Column<AppTableFeatures, TData>[];
  onReset: () => void;
}

function DataTableToolbarFilters<TData extends RowData>({
  columnFilters,
  columns,
  onReset,
}: DataTableToolbarFiltersProps<TData>) {
  const isFiltered = columnFilters.length > 0;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      {columns.map((column) => (
        <DataTableToolbarFilter key={column.id} column={column} />
      ))}
      {isFiltered && (
        <Button
          data-testid="reset-filters-btn"
          aria-label="Reset filters"
          variant="outline"
          className="border-dashed"
          onClick={onReset}
        >
          <X />
          Reset
        </Button>
      )}
    </div>
  );
}

interface DataTableToolbarFilterProps<TData extends RowData> {
  column: Column<AppTableFeatures, TData>;
}

function DataTableToolbarFilter<TData extends RowData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;
  if (!columnMeta?.variant) return null;

  switch (columnMeta.variant) {
    case "text":
      return (
        <Input
          data-testid={`filter-${column.id}`}
          placeholder={columnMeta.placeholder ?? columnMeta.label}
          value={(column.getFilterValue() as string) ?? ""}
          onChange={(event) => column.setFilterValue(event.target.value)}
          className="h-8 w-full min-w-0 sm:w-40 lg:w-56"
        />
      );

    case "number":
      return (
        <div className="relative">
          <Input
            type="number"
            inputMode="numeric"
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className={cn("h-8 w-30", columnMeta.unit && "pr-8")}
          />
          {columnMeta.unit && (
            <span className="bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm">
              {columnMeta.unit}
            </span>
          )}
        </div>
      );

    case "range":
      return (
        <DataTableSliderFilter
          column={column}
          title={columnMeta.label ?? column.id}
        />
      );

    case "date":
    case "dateRange":
      return (
        <DataTableDateFilter
          column={column}
          title={columnMeta.label ?? column.id}
          multiple={columnMeta.variant === "dateRange"}
        />
      );

    case "select":
    case "multiSelect":
      return (
        <DataTableFacetedFilter
          column={column}
          title={columnMeta.label ?? column.id}
          options={columnMeta.options ?? []}
          multiple={columnMeta.variant === "multiSelect"}
        />
      );

    default:
      return null;
  }
}
