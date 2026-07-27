import { render, screen } from "@testing-library/react";
import React from "react";
import { DataTableFetchingIndicator } from "./data-table-fetching-indicator";

describe("DataTableFetchingIndicator", () => {
  it("renders null when isFetching is false", () => {
    const { container } = render(
      <DataTableFetchingIndicator isFetching={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders loading indicator when isFetching is true", () => {
    render(<DataTableFetchingIndicator isFetching={true} />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
