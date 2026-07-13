import type { DataTableFilter } from "./data-table-schemas";

/**
 * Extracts a single string value from a data table filter.
 * Handles both string and array inputs (taking the first element if array).
 */
export function extractStringFilter(
  filters: DataTableFilter[] | undefined,
  id: string,
): string | undefined {
  if (!filters) return undefined;
  const filter = filters.find((f) => f.id === id);
  if (!filter) return undefined;

  const val = Array.isArray(filter.value) ? filter.value[0] : filter.value;
  if (typeof val === "string" && val) return val;
  return undefined;
}

/**
 * Extracts an array of string values from a data table filter.
 * Handles both string and array inputs (wrapping a single string in an array).
 */
export function extractArrayFilter<T extends string>(
  filters: DataTableFilter[] | undefined,
  id: string,
): T[] | undefined {
  if (!filters) return undefined;
  const filter = filters.find((f) => f.id === id);
  if (!filter) return undefined;

  if (Array.isArray(filter.value) && filter.value.length > 0) {
    return filter.value as T[];
  }
  if (typeof filter.value === "string" && filter.value) {
    return [filter.value as T];
  }
  return undefined;
}

export function appendWhereAnd<T extends { AND?: T | T[] }>(
  where: T,
  condition: T,
): void {
  const existing = where.AND;
  where.AND = Array.isArray(existing)
    ? [...existing, condition]
    : existing
      ? [existing, condition]
      : [condition];
}
