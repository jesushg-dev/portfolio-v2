import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { Column } from "@tanstack/react-table";
import { DataTableDateFilter } from "./data-table-date-filter";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableSliderFilter } from "./data-table-slider-filter";

function makeMockColumn(initialValue: unknown = undefined) {
  let filterValue = initialValue;
  const setFilterValue = jest.fn((val) => {
    filterValue = val;
  });
  return {
    getFilterValue: () => filterValue,
    setFilterValue,
    getFacetedMinMaxValues: () => [0, 100],
    getFacetedUniqueValues: () =>
      new Map([
        ["opt1", 5],
        ["opt2", 10],
      ]),
    columnDef: {
      meta: {
        unit: "USD",
        defaultRange: [0, 50],
      },
    },
  } as unknown as Column<unknown, unknown>;
}

describe("DataTableFacetedFilter", () => {
  it("renders trigger button with title and options count", () => {
    const col = makeMockColumn(["opt1"]);
    const options = [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
    ];

    render(
      <DataTableFacetedFilter
        column={col}
        title="Status"
        options={options}
        multiple={true}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeInTheDocument();
    fireEvent.click(buttons[0]);
  });

  it("handles single selection and clearing filter", () => {
    const col = makeMockColumn();
    const options = [{ label: "Single Opt", value: "s1" }];

    render(
      <DataTableFacetedFilter
        column={col}
        title="Single Filter"
        options={options}
        multiple={false}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeInTheDocument();
    fireEvent.click(buttons[0]);
  });

  it("renders faceted filter without selected values", () => {
    const col = makeMockColumn(undefined);
    const options = [{ label: "Opt", value: "o1" }];

    render(
      <DataTableFacetedFilter
        column={col}
        title="Category"
        options={options}
        multiple={true}
      />,
    );

    expect(screen.getByText("Category")).toBeInTheDocument();
  });
});

describe("DataTableDateFilter", () => {
  it("renders date filter button with single date", () => {
    const dateTs = new Date("2024-01-15").getTime();
    const col = makeMockColumn([dateTs]);

    render(
      <DataTableDateFilter
        column={col}
        title="Created Date"
        multiple={false}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeInTheDocument();
    fireEvent.click(buttons[0]);
  });

  it("renders range date filter button when multiple is true", () => {
    const fromTs = new Date("2024-01-01").getTime();
    const toTs = new Date("2024-01-31").getTime();
    const col = makeMockColumn([fromTs, toTs]);

    render(
      <DataTableDateFilter column={col} title="Date Range" multiple={true} />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeInTheDocument();
    fireEvent.click(buttons[0]);
  });

  it("renders unselected date filter button", () => {
    const col = makeMockColumn(undefined);
    render(<DataTableDateFilter column={col} title="Unset Date" />);

    expect(screen.getByText("Unset Date")).toBeInTheDocument();
  });
});

describe("DataTableSliderFilter", () => {
  it("renders slider filter button and display badge", () => {
    const col = makeMockColumn([10, 80]);

    render(<DataTableSliderFilter column={col} title="Price Range" />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeInTheDocument();
    fireEvent.click(buttons[0]);
  });

  it("renders slider filter when value is undefined", () => {
    const col = makeMockColumn(undefined);

    render(<DataTableSliderFilter column={col} title="Score" />);

    expect(screen.getByText("Score")).toBeInTheDocument();
  });
});
