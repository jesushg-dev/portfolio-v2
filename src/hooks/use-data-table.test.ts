import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

jest.mock("nuqs", () => {
  const createParser = () => {
    const parser: Record<string, unknown> = {};
    parser.withOptions = () => parser;
    parser.withDefault = (val: unknown) => {
      parser._default = val;
      return parser;
    };
    return parser;
  };
  return {
    useQueryState: (_key: string, parser: Record<string, unknown>) => {
      const defaultValue = parser && "_default" in parser ? parser._default : 1;
      const [val, setVal] = useState(defaultValue);
      return [val, setVal];
    },
    useQueryStates: () => [{}, jest.fn()],
    parseAsInteger: createParser(),
    parseAsString: createParser(),
    parseAsArrayOf: jest.fn(() => createParser()),
  };
});




jest.mock("nuqs/server", () => ({
  createParser: () => ({
    withOptions: () => ({}),
    withDefault: (val: unknown) => val,
  }),
}));

jest.mock("@/lib/parsers", () => ({
  getSortingStateParser: () => ({
    withOptions: () => ({
      withDefault: (val: unknown) => val,
    }),
  }),
}));

import { useDataTable } from "./use-data-table";


interface TestData {
  id: string;
  name: string;
  category: string;
}

const mockColumns: ColumnDef<TestData>[] = [
  {
    id: "id",
    accessorKey: "id",
    enableColumnFilter: false,
  },
  {
    id: "name",
    accessorKey: "name",
    enableColumnFilter: true,
  },
  {
    accessorKey: "category",
    enableColumnFilter: true,
    meta: {
      options: [
        { label: "Cat A", value: "a" },
        { label: "Cat B", value: "b" },
      ],
    },
  },
];

describe("useDataTable hook", () => {
  it("initializes table with pagination and sorting state", () => {
    const { result } = renderHook(() =>
      useDataTable({
        columns: mockColumns,
        data: [{ id: "1", name: "Item 1", category: "a" }],
        rowCount: 1,
        initialState: {
          pagination: { pageIndex: 0, pageSize: 5 },
          sorting: [{ id: "name", desc: false }],
        },
      })
    );

    expect(result.current.table).toBeDefined();
    expect(result.current.table.getState().pagination.pageSize).toBe(5);
  });

  it("handles pagination changes via callback function and direct value", () => {
    const { result } = renderHook(() =>
      useDataTable({
        columns: mockColumns,
        data: [],
        rowCount: 20,
      })
    );

    act(() => {
      result.current.table.setPageIndex(1);
    });
    expect(result.current.table.getState().pagination.pageIndex).toBe(1);

    act(() => {
      result.current.table.setPageSize(20);
    });
    expect(result.current.table.getState().pagination.pageSize).toBe(20);
  });

  it("handles sorting changes via function and direct value", () => {
    const { result } = renderHook(() =>
      useDataTable({
        columns: mockColumns,
        data: [],
        rowCount: 10,
      })
    );

    act(() => {
      result.current.table.setSorting([{ id: "name", desc: true }]);
    });
    expect(result.current.table.getState().sorting).toEqual([{ id: "name", desc: true }]);
  });

  it("handles column filter updates and resetting filters", () => {
    const { result } = renderHook(() =>
      useDataTable({
        columns: mockColumns,
        data: [],
        rowCount: 10,
      })
    );

    act(() => {
      result.current.table.setColumnFilters([{ id: "name", value: "search term" }]);
    });
    expect(result.current.table.getState().columnFilters).toEqual([
      { id: "name", value: "search term" },
    ]);

    act(() => {
      result.current.table.resetColumnFilters();
    });
    expect(result.current.table.getState().columnFilters).toEqual([]);
  });

  it("supports enableAdvancedFilter mode without auto column filter parsers", () => {
    const { result } = renderHook(() =>
      useDataTable({
        columns: mockColumns,
        data: [],
        rowCount: 10,
        enableAdvancedFilter: true,
      })
    );

    expect(result.current.table).toBeDefined();
  });
});
