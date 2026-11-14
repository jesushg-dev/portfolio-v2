import { render, screen } from "@testing-library/react";

import SpotifyScrollingText from "./spotify-scrolling-text";

describe("SpotifyScrollingText", () => {
  it("renders text content without error", () => {
    render(<SpotifyScrollingText>Test Song Title</SpotifyScrollingText>);
    expect(screen.getByText("Test Song Title")).toBeInTheDocument();
  });

  it("handles empty or complex children", () => {
    render(
      <SpotifyScrollingText>
        <span>Long song name (Remastered)</span>
      </SpotifyScrollingText>,
    );
    expect(screen.getByText("Long song name (Remastered)")).toBeInTheDocument();
  });
});
