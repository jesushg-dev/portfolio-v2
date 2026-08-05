import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders title, description and buttons when open", () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete Item"
        description="Are you sure you want to delete this item?"
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete this item?"),
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });

    expect(cancelButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(deleteButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(cancelButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render contents when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={jest.fn()}
        title="Hidden Dialog"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.queryByText("Hidden Dialog")).toBeNull();
  });
});
