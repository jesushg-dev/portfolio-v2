import { render, screen } from "@testing-library/react";
import { UniversalIconPicker } from "./universal-icon-picker";

describe("UniversalIconPicker", () => {
  it("renders trigger with placeholder when empty", () => {
    render(
      <UniversalIconPicker
        onChange={jest.fn()}
        placeholder="Choose icon..."
        triggerId="test-icon-select"
      />,
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders preview container when showPreview is true", () => {
    render(
      <UniversalIconPicker
        value="code"
        onChange={jest.fn()}
        triggerId="test-icon-select"
        showPreview
      />,
    );

    expect(
      screen.getByTestId("test-icon-select-preview"),
    ).toBeInTheDocument();
  });
});
