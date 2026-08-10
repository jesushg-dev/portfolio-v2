import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { Column, ReactTable, RowData } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { createMockSubscribe } from "@/test-utils/mock-table-subscribe";
import { DataTableToolbar } from "./data-table-toolbar";

function makeMockColumn(
  id: string,
  variant?: string,
  extraMeta?: Record<string, unknown>,
) {
  const getFilterValue = jest.fn().mockReturnValue("");
  const setFilterValue = jest.fn();
  return {
    id,
    getCanFilter: () => true,
    getFilterValue,
    setFilterValue,
    getFacetedMinMaxValues: () => [0, 100],
    getFacetedUniqueValues: () => new Map(),
    columnDef: {
      meta: {
        variant,
        label: `Label ${id}`,
        ...extraMeta,
      },
    },
  } as unknown as Column<AppTableFeatures, RowData>;
}

function makeMockTable(
  columns: Column<AppTableFeatures, RowData>[],
  isFiltered = false,
) {
  const resetColumnFilters = jest.fn();
  const tableState = {
    columnFilters: isFiltered ? [{ id: "col1", value: "test" }] : [],
  };
  const table = {
    state: tableState,
    getAllColumns: () => columns,
    resetColumnFilters,
    Subscribe: createMockSubscribe(tableState),
  } as unknown as ReactTable<AppTableFeatures, RowData>;

  return { table, resetColumnFilters };
}

describe("DataTableToolbar", () => {
  it("renders text filter input and handles change", () => {
    const colText = makeMockColumn("name", "text", {
      placeholder: "Search name",
    });
    const { table } = makeMockTable([colText]);

    render(<DataTableToolbar table={table} />);

    const input = screen.getByPlaceholderText("Search name");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "John" } });
    expect(colText.setFilterValue).toHaveBeenCalledWith("John");
  });

  it("renders number filter input with unit badge", () => {
    const colNumber = makeMockColumn("age", "number", { unit: "yrs" });
    const { table } = makeMockTable([colNumber]);

    render(<DataTableToolbar table={table} />);

    expect(screen.getByText("yrs")).toBeInTheDocument();
  });

  it("renders reset button when isFiltered is true and calls resetColumnFilters", () => {
    const colText = makeMockColumn("title", "text");
    const { table, resetColumnFilters } = makeMockTable([colText], true);

    render(<DataTableToolbar table={table} />);

    const resetBtn = screen.getByTestId("reset-filters-btn");
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(resetColumnFilters).toHaveBeenCalled();
  });

  it("renders range, date, and select filter components", () => {
    const cols = [
      makeMockColumn("score", "range"),
      makeMockColumn("created", "date"),
      makeMockColumn("category", "select", {
        options: [{ label: "A", value: "a" }],
      }),
    ];
    const { table } = makeMockTable(cols);

    render(<DataTableToolbar table={table} />);

    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });
});
