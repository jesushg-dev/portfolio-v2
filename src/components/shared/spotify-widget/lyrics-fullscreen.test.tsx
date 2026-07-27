import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import LyricsFullscreen from "./lyrics-fullscreen";

describe("LyricsFullscreen", () => {
  const defaultProps = {
    title: "Get Lucky",
    artist: "Daft Punk",
    plainLyrics: "Like the legend of the phoenix\nAll ends with beginnings",
    syncedLyrics:
      "[00:10.00] Like the legend of the phoenix\n[00:20.00] All ends with beginnings",
    accentColor: "#1db954",
    showProgress: true,
    progressMs: 15000,
    durationMs: 240000,
    backLabel: "Back",
    providedByLabel: "Provided by LRCLIB",
    onBack: jest.fn(),
  };

  it("renders song title, artist, synced lyrics, and back button", () => {
    render(<LyricsFullscreen {...defaultProps} />);

    expect(screen.getByText("Get Lucky")).toBeInTheDocument();
    expect(screen.getByText("Daft Punk")).toBeInTheDocument();
    expect(
      screen.getByText("Like the legend of the phoenix"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("triggers onBack when back button is clicked", () => {
    render(<LyricsFullscreen {...defaultProps} />);

    const backBtn = screen.getByRole("button", { name: "Back" });
    fireEvent.click(backBtn);

    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it("renders plain lyrics when syncedLyrics is null", () => {
    render(
      <LyricsFullscreen
        {...defaultProps}
        syncedLyrics={null}
        showProgress={false}
      />,
    );

    expect(
      screen.getByText(/Like the legend of the phoenix/),
    ).toBeInTheDocument();
  });
});
