import { render, screen } from "@testing-library/react";
import React from "react";
import FormStatus from "./form-status";

describe("FormStatus", () => {
  it("renders null when both error and success are missing/falsy", () => {
    const { container } = render(<FormStatus />);
    expect(container.firstChild).toBeNull();
  });

  it("renders error message when error is provided", () => {
    render(<FormStatus error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders default success message when success is true", () => {
    render(<FormStatus success={true} />);
    expect(screen.getByText("Saved.")).toBeInTheDocument();
  });

  it("renders custom success message when provided", () => {
    render(<FormStatus success={true} successMessage="Updated successfully!" />);
    expect(screen.getByText("Updated successfully!")).toBeInTheDocument();
  });

  it("renders both error and success if both are set", () => {
    render(<FormStatus error="Warning note" success={true} successMessage="Partial save" />);
    expect(screen.getByText("Warning note")).toBeInTheDocument();
    expect(screen.getByText("Partial save")).toBeInTheDocument();
  });
});
