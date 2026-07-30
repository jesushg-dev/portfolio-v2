import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import LyricsCard from "./lyrics-card";

const labels = {
  title: "LYRICS",
  loading: "Loading lyrics...",
  notFound: "No lyrics for this track",
  temporarilyUnavailable: "Lyrics aren't available right now",
  expand: "Expand lyrics",
};

describe("LyricsCard component", () => {
  it("renders loading skeletons when status is loading or idle", () => {
    render(
      <LyricsCard
        accentColor="#1DB954"
        height={200}
        lyricsState={{ status: "loading", lyrics: null }}
        progressMs={0}
        labels={labels}
        onExpand={jest.fn()}
      />,
    );

    expect(screen.getByText("Loading lyrics...")).toBeInTheDocument();
  });

  it("renders not-found state when status is empty", () => {
    render(
      <LyricsCard
        accentColor="#1DB954"
        height={200}
        lyricsState={{ status: "empty", lyrics: null }}
        progressMs={0}
        labels={labels}
        onExpand={jest.fn()}
      />,
    );

    expect(screen.getByText("No lyrics for this track")).toBeInTheDocument();
  });

  it("renders temporary-unavailable state when status is temporary", () => {
    render(
      <LyricsCard
        accentColor="#1DB954"
        height={200}
        lyricsState={{ status: "temporary", lyrics: null }}
        progressMs={0}
        labels={labels}
        onExpand={jest.fn()}
      />,
    );

    expect(
      screen.getByText("Lyrics aren't available right now"),
    ).toBeInTheDocument();
  });

  it("renders synced lyrics and calls onExpand when clicked", () => {
    const onExpand = jest.fn();
    const syncedLrc = "[00:01.00] Line one\n[00:05.00] Line two";
    render(
      <LyricsCard
        accentColor="#1DB954"
        height={200}
        lyricsState={{
          status: "ready",
          lyrics: {
            plainLyrics: "Line one\nLine two",
            syncedLyrics: syncedLrc,
          },
        }}
        progressMs={2000}
        labels={labels}
        onExpand={onExpand}
      />,
    );

    expect(screen.getByText("Line one")).toBeInTheDocument();
    expect(screen.getByText("Line two")).toBeInTheDocument();

    const expandBtn = screen.getByRole("button", { name: "Expand lyrics" });
    fireEvent.click(expandBtn);
    expect(onExpand).toHaveBeenCalled();
  });

  it("renders plain lyrics when syncedLyrics is null", () => {
    render(
      <LyricsCard
        accentColor="#1DB954"
        height={200}
        lyricsState={{
          status: "ready",
          lyrics: {
            plainLyrics: "Plain verse line 1\nPlain verse line 2",
            syncedLyrics: null,
          },
        }}
        progressMs={0}
        labels={labels}
        onExpand={jest.fn()}
      />,
    );

    expect(screen.getByText("Plain verse line 1")).toBeInTheDocument();
    expect(screen.getByText("Plain verse line 2")).toBeInTheDocument();
  });
});
