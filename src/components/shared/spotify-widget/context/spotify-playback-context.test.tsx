import { screen } from "@testing-library/react";
import { act } from "@testing-library/react";

import {
  mockNowPlayingTrack,
  mockTrack,
} from "@/test-utils/fixtures/spotify-data";
import { ETime } from "@/utils/constants/times";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import {
  mapQueuedTrackPlayback,
  mapTrackNowPlaying,
} from "../utils/playback-mappers";
import {
  SpotifyPlaybackProvider,
  useSpotifyPlaybackContext,
} from "./spotify-playback-context";

jest.mock("../hooks/use-track-lyrics", () => ({
  prefetchTrackLyrics: jest.fn(() => Promise.resolve()),
}));

jest.mock("../hooks/use-prefetch-next-lyrics", () => ({
  usePrefetchNextLyrics: jest.fn(),
}));

function ProgressReadout() {
  const { liveProgressMs, playback } = useSpotifyPlaybackContext();
  return (
    <>
      <span data-testid="progress">{liveProgressMs}</span>
      <span data-testid="title">{playback.title}</span>
    </>
  );
}

describe("SpotifyPlaybackProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resets live progress when contentId changes", () => {
    const firstTrack = mapTrackNowPlaying(mockTrack, {
      ...mockNowPlayingTrack,
      progress_ms: 175_000,
    });

    const secondTrack = mapTrackNowPlaying(
      { ...mockTrack, id: "track-2", name: "Next Track" },
      {
        ...mockNowPlayingTrack,
        progress_ms: 4_000,
        timestamp: mockNowPlayingTrack.timestamp + 1,
      },
    );

    const { rerender } = renderWithIntl(
      <SpotifyPlaybackProvider playback={firstTrack}>
        <ProgressReadout />
      </SpotifyPlaybackProvider>,
    );

    expect(screen.getByTestId("progress")).toHaveTextContent("175000");

    rerender(
      <SpotifyPlaybackProvider playback={secondTrack}>
        <ProgressReadout />
      </SpotifyPlaybackProvider>,
    );

    expect(screen.getByTestId("progress")).toHaveTextContent("4000");
  });

  it("advances optimistically to the next queued track when the current one finishes", () => {
    const currentTrack = mapTrackNowPlaying(mockTrack, {
      ...mockNowPlayingTrack,
      progress_ms: 247_000,
    });
    const nextTrack = mapQueuedTrackPlayback(
      { ...mockTrack, id: "track-next", name: "Next Track" },
      currentTrack,
    );

    renderWithIntl(
      <SpotifyPlaybackProvider
        playback={currentTrack}
        nextTrackPlayback={nextTrack}
      >
        <ProgressReadout />
      </SpotifyPlaybackProvider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Get Lucky");

    act(() => {
      jest.advanceTimersByTime(2 * ETime.SECOND);
    });

    expect(screen.getByTestId("title")).toHaveTextContent("Next Track");
    expect(Number(screen.getByTestId("progress").textContent)).toBeGreaterThanOrEqual(
      0,
    );
  });
});
