import { renderHook } from "@testing-library/react";

import { SPOTIFY_NEAR_END_MS } from "./spotify-timing";
import { prefetchTrackLyrics } from "./use-track-lyrics";
import { usePrefetchNextLyrics } from "./use-prefetch-next-lyrics";

jest.mock("./use-track-lyrics", () => ({
  prefetchTrackLyrics: jest.fn(() => Promise.resolve()),
}));

const nextTrack = {
  contentId: "track-next",
  title: "Next Song",
  artist: "Artist",
  album: "Album",
  durationMs: 180_000,
};

describe("usePrefetchNextLyrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefetches only when the current track is near the end", () => {
    const { rerender } = renderHook(
      (props: { liveProgressMs: number }) =>
        usePrefetchNextLyrics({
          currentContentId: "track-current",
          nextTrack,
          liveProgressMs: props.liveProgressMs,
          durationMs: 240_000,
          isPlaying: true,
        }),
      { initialProps: { liveProgressMs: 120_000 } },
    );

    expect(prefetchTrackLyrics).not.toHaveBeenCalled();

    rerender({ liveProgressMs: 240_000 - SPOTIFY_NEAR_END_MS + 1_000 });

    expect(prefetchTrackLyrics).toHaveBeenCalledWith(nextTrack);
    expect(prefetchTrackLyrics).toHaveBeenCalledTimes(1);
  });

  it("does not prefetch while playback is paused", () => {
    renderHook(() =>
      usePrefetchNextLyrics({
        currentContentId: "track-current",
        nextTrack,
        liveProgressMs: 230_000,
        durationMs: 240_000,
        isPlaying: false,
      }),
    );

    expect(prefetchTrackLyrics).not.toHaveBeenCalled();
  });
});
