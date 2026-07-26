import { render, screen } from "@testing-library/react";
import React from "react";
import type { Table } from "@tanstack/react-table";
import { DataTable } from "./data-table";

function makeMockTable(opts?: {
  headers?: { id: string; isPlaceholder?: boolean; colSpan?: number; size?: number }[];
  rows?: { id: string; isSelected?: boolean; cells?: { id: string; value: string; size?: number }[] }[];
  selectedRowsCount?: number;
}) {
  const headers = opts?.headers ?? [
    { id: "col1", isPlaceholder: false, colSpan: 1, size: 200 },
    { id: "col2", isPlaceholder: true, colSpan: 1, size: 150 },
  ];

  const headerGroup = {
    id: "hg1",
    headers: headers.map((h) => ({
      id: h.id,
      colSpan: h.colSpan ?? 1,
      isPlaceholder: h.isPlaceholder ?? false,
      getContext: () => ({}),
      column: {
        id: h.id,
        getSize: () => h.size ?? 150,
        getIsPinned: () => false,
        columnDef: { header: () => `Header ${h.id}` },
      },
    })),
  };

  const mockRows = (opts?.rows ?? [
    {
      id: "row1",
      isSelected: true,
      cells: [
        { id: "cell1", value: "Cell 1 Data", size: 200 },
        { id: "cell2", value: "Cell 2 Data", size: 150 },
      ],
    },
  ]).map((r) => ({
    id: r.id,
    getIsSelected: () => r.isSelected ?? false,
    getVisibleCells: () =>
      (r.cells ?? []).map((c) => ({
        id: c.id,
        getContext: () => ({}),
        column: {
          id: c.id,
          getSize: () => c.size ?? 150,
          getIsPinned: () => false,
          columnDef: { cell: () => c.value },
        },
      })),
  }));

  return {
    getHeaderGroups: () => [headerGroup],
    getRowModel: () => ({ rows: mockRows }),
    getAllColumns: () => headers.map((h) => ({ id: h.id })),
    getFilteredSelectedRowModel: () => ({ rows: new Array(opts?.selectedRowsCount ?? 1) }),
    getFilteredRowModel: () => ({ rows: mockRows }),
    getState: () => ({ pagination: { pageIndex: 0, pageSize: 10 } }),
    getPageCount: () => 1,
    getCanPreviousPage: () => false,
    getCanNextPage: () => false,
  } as unknown as Table<unknown>;
}

describe("DataTable component", () => {
  it("renders header groups, row cells, selected row state, and action bar when rows are selected", () => {
    const table = makeMockTable({ selectedRowsCount: 1 });
    render(
      <DataTable table={table} actionBar={<div data-testid="action-bar">Bulk Delete</div>}>
        <div data-testid="toolbar-child">Toolbar Content</div>
      </DataTable>
    );

    expect(screen.getByTestId("toolbar-child")).toBeInTheDocument();
    expect(screen.getByText("Header col1")).toBeInTheDocument();
    expect(screen.getByText("Cell 1 Data")).toBeInTheDocument();
    expect(screen.getByTestId("action-bar")).toBeInTheDocument();
  });

  it("renders empty state 'No results.' when row model is empty", () => {
    const table = makeMockTable({ rows: [] });
    render(<DataTable table={table} />);

    expect(screen.getByText("No results.")).toBeInTheDocument();
  });
});
