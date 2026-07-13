import { z } from "zod";
import { dataTableConfig } from "@/config/data-table";

export const dataTableSortSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

export const dataTableFilterSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(
    dataTableConfig.filterVariants as unknown as [string, ...string[]],
  ),
  operator: z.enum(
    dataTableConfig.operators as unknown as [string, ...string[]],
  ),
  filterId: z.string(),
});

export const dataTableParamsSchema = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
  sort: z.array(dataTableSortSchema).optional().default([]),
  filters: z.array(dataTableFilterSchema).optional().default([]),
});

export type DataTableFilter = z.infer<typeof dataTableFilterSchema>;
export type DataTableParams = z.infer<typeof dataTableParamsSchema>;
