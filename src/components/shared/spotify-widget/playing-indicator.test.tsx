import { render } from "@testing-library/react";
import React from "react";
import PlayingIndicator from "./playing-indicator";

describe("PlayingIndicator", () => {
  it("renders with default color and custom color", () => {
    const { container, rerender } = render(<PlayingIndicator />);
    const bars = container.querySelectorAll("span");
    expect(bars).toHaveLength(3);
    expect(bars[0].style.backgroundColor).toBe("rgb(29, 185, 84)");

    rerender(<PlayingIndicator color="#ff0000" />);
    const updatedBars = container.querySelectorAll("span");
    expect(updatedBars[0].style.backgroundColor).toBe("rgb(255, 0, 0)");
  });
});
