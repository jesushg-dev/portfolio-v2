import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedMinMaxValues,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import type { DataTableConfig } from "@/config/data-table";
import type { ComponentProps, ComponentType } from "react";

export type AppFilterVariant = DataTableConfig["filterVariants"][number];

export interface AppTableQueryKeys {
  page: string;
  perPage: string;
  sort: string;
  filters: string;
  joinOperator: string;
}

export interface AppColumnOption {
  label: string;
  value: string;
  count?: number;
  icon?: ComponentType<ComponentProps<"svg">>;
}

export interface AppColumnMeta {
  label?: string;
  placeholder?: string;
  variant?: AppFilterVariant;
  options?: AppColumnOption[];
  range?: [number, number];
  unit?: string;
  icon?: ComponentType<ComponentProps<"svg">>;
}

export interface AppTableMeta {
  queryKeys?: AppTableQueryKeys;
}

export const appTableFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  facetedUniqueValues: createFacetedUniqueValues(),
  columnMeta: metaHelper<AppColumnMeta>(),
  tableMeta: metaHelper<AppTableMeta>(),
});

export type AppTableFeatures = typeof appTableFeatures;
