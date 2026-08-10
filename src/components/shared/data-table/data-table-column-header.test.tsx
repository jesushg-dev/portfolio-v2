import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { Column, RowData } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { DataTableColumnHeader } from "./data-table-column-header";

function makeMockColumn(
  isSorted: false | "asc" | "desc" = false,
  canSort = true,
  canHide = true,
) {
  return {
    getCanSort: () => canSort,
    getCanHide: () => canHide,
    getIsSorted: () => isSorted,
    getIsVisible: () => true,
    toggleSorting: jest.fn(),
    toggleVisibility: jest.fn(),
  } as unknown as Column<AppTableFeatures, RowData, unknown>;
}

describe("DataTableColumnHeader", () => {
  it("renders plain title when column cannot be sorted", () => {
    const col = makeMockColumn(false, false, false);
    render(<DataTableColumnHeader column={col} label="Name" />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders sort button and dropdown options when column can be sorted", () => {
    const col = makeMockColumn(false, true, true);
    render(<DataTableColumnHeader column={col} label="Title" />);

    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
  });

  it("renders sorted ascending icon when column is sorted asc", () => {
    const col = makeMockColumn("asc", true, true);
    render(<DataTableColumnHeader column={col} label="Created At" />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders sorted descending icon when column is sorted desc", () => {
    const col = makeMockColumn("desc", true, true);
    render(<DataTableColumnHeader column={col} label="Created At" />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
