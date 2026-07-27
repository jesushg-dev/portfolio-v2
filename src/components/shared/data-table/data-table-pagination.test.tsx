import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { Table } from "@tanstack/react-table";
import { DataTablePagination } from "./data-table-pagination";

function makeMockTable(opts?: {
  selectedRows?: number;
  totalRows?: number;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  canPrevious?: boolean;
  canNext?: boolean;
}) {
  const setPageIndex = jest.fn();
  const previousPage = jest.fn();
  const nextPage = jest.fn();
  const setPageSize = jest.fn();

  const table = {
    getFilteredSelectedRowModel: () => ({
      rows: new Array(opts?.selectedRows ?? 2),
    }),
    getFilteredRowModel: () => ({ rows: new Array(opts?.totalRows ?? 10) }),
    getState: () => ({
      pagination: {
        pageIndex: opts?.pageIndex ?? 1,
        pageSize: opts?.pageSize ?? 10,
      },
    }),
    getPageCount: () => opts?.pageCount ?? 5,
    getCanPreviousPage: () => opts?.canPrevious ?? true,
    getCanNextPage: () => opts?.canNext ?? true,
    setPageIndex,
    previousPage,
    nextPage,
    setPageSize,
  } as unknown as Table<unknown>;

  return { table, setPageIndex, previousPage, nextPage, setPageSize };
}

describe("DataTablePagination", () => {
  it("renders row selection count, page info, and handles first/prev/next/last clicks", () => {
    const { table, setPageIndex, previousPage, nextPage } = makeMockTable();

    render(<DataTablePagination table={table} />);

    expect(screen.getByText("2 of 10 row(s) selected.")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();

    const firstBtn = screen.getByTestId("pagination-first");
    const prevBtn = screen.getByTestId("pagination-previous");
    const nextBtn = screen.getByTestId("pagination-next");
    const lastBtn = screen.getByTestId("pagination-last");

    fireEvent.click(firstBtn);
    expect(setPageIndex).toHaveBeenCalledWith(0);

    fireEvent.click(prevBtn);
    expect(previousPage).toHaveBeenCalled();

    fireEvent.click(nextBtn);
    expect(nextPage).toHaveBeenCalled();

    fireEvent.click(lastBtn);
    expect(setPageIndex).toHaveBeenCalledWith(4);
  });

  it("disables previous buttons when canPreviousPage is false", () => {
    const { table } = makeMockTable({ canPrevious: false });
    render(<DataTablePagination table={table} />);

    expect(screen.getByTestId("pagination-first")).toBeDisabled();
    expect(screen.getByTestId("pagination-previous")).toBeDisabled();
  });

  it("disables next buttons when canNextPage is false", () => {
    const { table } = makeMockTable({ canNext: false });
    render(<DataTablePagination table={table} />);

    expect(screen.getByTestId("pagination-next")).toBeDisabled();
    expect(screen.getByTestId("pagination-last")).toBeDisabled();
  });
});
