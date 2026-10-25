import { render, screen, fireEvent } from "@testing-library/react";
import { DataTableBulkBar } from "./data-table-bulk-bar";

describe("DataTableBulkBar", () => {
  it("renders null when selectedCount is 0", () => {
    const onClear = jest.fn();
    const { container } = render(
      <DataTableBulkBar selectedCount={0} onClearSelection={onClear} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders selected count and action buttons", () => {
    const onClear = jest.fn();
    const onDelete = jest.fn();

    render(
      <DataTableBulkBar
        selectedCount={3}
        onClearSelection={onClear}
        onDeleteSelected={onDelete}
        selectedText="seleccionadas"
        clearText="Quitar selección"
        deleteText="Eliminar selección"
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("seleccionadas")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: /quitar selección/i });
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);

    const deleteBtn = screen.getByRole("button", {
      name: /eliminar selección/i,
    });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables delete button while isDeleting is true", () => {
    const onClear = jest.fn();
    const onDelete = jest.fn();

    render(
      <DataTableBulkBar
        selectedCount={2}
        onClearSelection={onClear}
        onDeleteSelected={onDelete}
        isDeleting={true}
      />,
    );

    const deleteBtn = screen.getByRole("button", { name: /delete selected/i });
    expect(deleteBtn).toBeDisabled();
  });
});
