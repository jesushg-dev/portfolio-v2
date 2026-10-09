import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import { ProjectEmptyState } from "./project-empty-state";

describe("ProjectEmptyState", () => {
  it("renders category title and description for FRONTEND", () => {
    const handleReset = jest.fn();
    renderWithIntl(<ProjectEmptyState type="FRONTEND" onReset={handleReset} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Frontend")).toBeInTheDocument();

    const resetButton = screen.getByRole("button");
    fireEvent.click(resetButton);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it("renders all categories title when type is undefined", () => {
    renderWithIntl(<ProjectEmptyState />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
