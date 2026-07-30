import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import {
  mockNowPlayingTrack,
  mockRecentlyPlayed,
  mockTrack,
} from "@/test-utils/fixtures/spotify-data";
import {
  mapRecentlyPlayed,
  mapTrackNowPlaying,
} from "./utils/playback-mappers";
import type { SpotifyPlayback, SpotifyPlaybackError } from "./types/types";
import type { TrackLyricsRequest } from "./types/track-lyrics-types";

interface SpotifyPlaybackHookResult {
  playback: SpotifyPlayback | null;
  nextTrackLyrics: TrackLyricsRequest | null;
  error: SpotifyPlaybackError | null;
  isLoading: boolean;
  isFetchError: boolean;
}

const mockUseSpotifyPlayback = jest.fn((): SpotifyPlaybackHookResult => ({
  playback: null,
  nextTrackLyrics: null,
  error: null,
  isLoading: false,
  isFetchError: false,
}));

jest.mock("./hooks/use-spotify-playback", () => ({
  useSpotifyPlayback: (): SpotifyPlaybackHookResult => mockUseSpotifyPlayback(),
}));

import SpotifyWidget from "./index";

describe("SpotifyWidget", () => {
  beforeEach(() => {
    mockUseSpotifyPlayback.mockReset();
  });

  it("shows skeleton while loading", () => {
    mockUseSpotifyPlayback.mockReturnValue({
      playback: null,
      nextTrackLyrics: null,
      error: null,
      isLoading: true,
      isFetchError: false,
    });

    renderWithIntl(<SpotifyWidget />);

    expect(screen.getByTestId("spotify-widget-skeleton")).toBeInTheDocument();
  });

  it("shows fetch error message", () => {
    mockUseSpotifyPlayback.mockReturnValue({
      playback: null,
      nextTrackLyrics: null,
      error: null,
      isLoading: false,
      isFetchError: true,
    });

    renderWithIntl(<SpotifyWidget />);

    expect(screen.getByText("Nothing is playing")).toBeInTheDocument();
  });

  it("shows API error message", () => {
    mockUseSpotifyPlayback.mockReturnValue({
      playback: null,
      nextTrackLyrics: null,
      error: { status: 500, message: "Server error" },
      isLoading: false,
      isFetchError: false,
    });

    renderWithIntl(<SpotifyWidget />);

    expect(screen.getByText("Nothing is playing")).toBeInTheDocument();
  });

  it("shows empty state when nothing is playing", () => {
    mockUseSpotifyPlayback.mockReturnValue({
      playback: null,
      nextTrackLyrics: null,
      error: null,
      isLoading: false,
      isFetchError: false,
    });

    renderWithIntl(<SpotifyWidget />);

    expect(screen.getByText("Nothing is playing")).toBeInTheDocument();
  });

  it("renders the expandable player when playback is available", () => {
    mockUseSpotifyPlayback.mockReturnValue({
      playback: mapTrackNowPlaying(mockTrack, mockNowPlayingTrack),
      nextTrackLyrics: null,
      error: null,
      isLoading: false,
      isFetchError: false,
    });

    renderWithIntl(<SpotifyWidget />);

    expect(screen.getByText("Get Lucky")).toBeInTheDocument();
    expect(
      screen.getByText("Daft Punk feat Pharrell Williams"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Lucky" })).toHaveAttribute(
      "href",
      "https://open.spotify.com/track/track-1",
    );
  });

  it("shows recently played notice in the mini player", () => {
    const playback = mapRecentlyPlayed(mockRecentlyPlayed);

    mockUseSpotifyPlayback.mockReturnValue({
      playback,
      nextTrackLyrics: null,
      error: null,
      isLoading: false,
      isFetchError: false,
    });

    renderWithIntl(<SpotifyWidget />);

    expect(
      screen.getByText((content) =>
        content.includes("Nothing is playing right now"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last played/)).toBeInTheDocument();
  });
});
