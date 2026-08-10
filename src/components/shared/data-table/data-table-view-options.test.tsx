import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { Column, ReactTable, RowData } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { createMockSubscribe } from "@/test-utils/mock-table-subscribe";
import { DataTableViewOptions } from "./data-table-view-options";

function makeMockColumn(id: string, isVisible = true) {
  const toggleVisibility = jest.fn();
  return {
    id,
    accessorFn: () => "val",
    getCanHide: () => true,
    getIsVisible: () => isVisible,
    toggleVisibility,
    columnDef: {
      meta: { label: `Column ${id}` },
    },
  } as unknown as Column<AppTableFeatures, RowData>;
}

describe("DataTableViewOptions", () => {
  it("renders toggle columns button and column items", () => {
    const col1 = makeMockColumn("name");
    const col2 = makeMockColumn("email", false);
    const tableState = { columnVisibility: {} };
    const table = {
      getAllColumns: () => [col1, col2],
      state: tableState,
      Subscribe: createMockSubscribe(tableState),
    } as unknown as ReactTable<AppTableFeatures, RowData>;

    render(<DataTableViewOptions table={table} />);

    const toggleBtn = screen.getByTestId("toggle-columns-btn");
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);

    const item1 = screen.getByTestId("toggle-column-name");
    expect(item1).toHaveAttribute("data-checked", "true");

    fireEvent.click(item1);
    expect(col1.toggleVisibility).toHaveBeenCalledWith(false);
  });
});
