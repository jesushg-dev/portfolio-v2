import { render } from "@testing-library/react";

import PlayingIndicator from "./playing-indicator";

describe("PlayingIndicator", () => {
  it("renders equalizer bars when playing", () => {
    const { container, rerender } = render(<PlayingIndicator isPlaying />);
    const bars = container.querySelectorAll("span");
    expect(bars).toHaveLength(3);
    expect(bars[0].style.backgroundColor).toBe("rgb(29, 185, 84)");

    rerender(<PlayingIndicator color="#ff0000" isPlaying />);
    const updatedBars = container.querySelectorAll("span");
    expect(updatedBars[0].style.backgroundColor).toBe("rgb(255, 0, 0)");
  });

  it("renders pause icon when paused", () => {
    const { container } = render(<PlayingIndicator isPlaying={false} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
