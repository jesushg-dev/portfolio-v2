import { render, screen, fireEvent } from "@testing-library/react";
import {
  DataTableCategoryChips,
  type CategoryChipOption,
} from "./data-table-category-chips";

describe("DataTableCategoryChips", () => {
  const chips: CategoryChipOption[] = [
    { value: "all", label: "Todos", count: 12 },
    { value: "WORK", label: "Trabajo", count: 8 },
    { value: "STUDY", label: "Estudio", count: 4 },
  ];

  it("renders all chips with labels and count", () => {
    const onChange = jest.fn();
    render(
      <DataTableCategoryChips chips={chips} value="all" onChange={onChange} />,
    );

    expect(screen.getByText("Todos")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Trabajo")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Estudio")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("calls onChange when a chip is clicked", () => {
    const onChange = jest.fn();
    render(
      <DataTableCategoryChips chips={chips} value="all" onChange={onChange} />,
    );

    fireEvent.click(screen.getByText("Trabajo"));
    expect(onChange).toHaveBeenCalledWith("WORK");
  });

  it("renders null if chips array has 1 or fewer items", () => {
    const onChange = jest.fn();
    const { container } = render(
      <DataTableCategoryChips
        chips={[{ value: "all", label: "Todos" }]}
        value="all"
        onChange={onChange}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
