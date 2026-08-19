import type { ColumnSort, Row, RowData } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import type { FilterItemSchema } from "@/lib/parsers";

export type { DataTableConfig } from "@/config/data-table";
export type FilterOperator =
  import("@/config/data-table").DataTableConfig["operators"][number];
export type JoinOperator =
  import("@/config/data-table").DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData extends RowData> extends Omit<
  ColumnSort,
  "id"
> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<
  TData extends RowData,
> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData extends RowData> {
  row: Row<AppTableFeatures, TData>;
  variant: "update" | "delete";
}
