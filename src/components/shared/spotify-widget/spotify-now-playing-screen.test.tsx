import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import {
  mockEpisode,
  mockNowPlayingEpisodeNullItem,
  mockNowPlayingTrack,
  mockRecentlyPlayed,
  mockTrack,
} from "@/test-utils/fixtures/spotify-data";

import SpotifyNowPlayingScreen from "./spotify-now-playing-screen";
import type { SpotifyPlayback } from "./types";
import type { SpotifyDragMotionValue } from "./use-drag-to-close";
import {
  mapEpisodeNowPlaying,
  mapRecentlyPlayed,
  mapTrackNowPlaying,
} from "./playback-mappers";
import { SpotifyPlaybackProvider } from "./spotify-playback-context";

jest.mock("./use-track-lyrics", () => ({
  useTrackLyrics: () => ({ status: "empty", lyrics: null }),
  prefetchTrackLyrics: jest.fn(() => Promise.resolve()),
  previewLyricsLines: (text: string) =>
    text
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean)
      .slice(0, 3),
}));

const dragProps = {
  drag: "y" as const,
  dragConstraints: { top: 0, bottom: 0 },
  dragElastic: { top: 0, bottom: 0.38 },
  dragMomentum: false,
  onDragEnd: jest.fn(),
};

const motionY = {
  get: () => 0,
  set: jest.fn(),
  stop: jest.fn(),
} as unknown as SpotifyDragMotionValue;

function renderNowPlayingScreen(
  playback: SpotifyPlayback,
  props: Partial<React.ComponentProps<typeof SpotifyNowPlayingScreen>> = {},
) {
  return renderWithIntl(
    <SpotifyPlaybackProvider playback={playback}>
      <SpotifyNowPlayingScreen
        accentColor="#1db954"
        locale="en"
        flyComplete
        coverSize={220}
        dragY={motionY}
        dragProps={dragProps}
        onClose={jest.fn()}
        {...props}
      />
    </SpotifyPlaybackProvider>,
  );
}

describe("SpotifyNowPlayingScreen", () => {
  it("renders now playing header and spotify links for a track", () => {
    const playback = mapTrackNowPlaying(mockTrack, mockNowPlayingTrack);

    renderNowPlayingScreen(playback, { accentColor: "#1db954" });

    expect(screen.getByText("Now Playing")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open in Spotify" }),
    ).toHaveAttribute("href", "https://open.spotify.com/track/track-1");
    expect(screen.getByRole("link", { name: "Get Lucky" })).toHaveAttribute(
      "href",
      "https://open.spotify.com/track/track-1",
    );
    expect(
      screen.getByRole("link", { name: "Daft Punk feat Pharrell Williams" }),
    ).toHaveAttribute("href", "https://open.spotify.com/artist/artist-1");
  });

  it("renders recently played header and idle notice for history fallback", () => {
    const playback = mapRecentlyPlayed(mockRecentlyPlayed);

    renderNowPlayingScreen(playback!, {
      accentColor: "#191414",
      coverSize: undefined,
    });

    expect(screen.getByText("Last played")).toBeInTheDocument();
    expect(
      screen.getByText(/Nothing is playing right now/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Now Playing")).not.toBeInTheDocument();
  });

  it("renders episode metadata and progress for podcasts", () => {
    const playback = mapEpisodeNowPlaying(
      mockEpisode,
      mockNowPlayingEpisodeNullItem,
    );

    renderNowPlayingScreen(playback, { accentColor: "#191414" });

    expect(
      screen.getByRole("link", { name: "Taste the Cloud" }),
    ).toHaveAttribute("href", "https://open.spotify.com/episode/episode-1");
    expect(screen.getByRole("link", { name: "Syntax FM" })).toHaveAttribute(
      "href",
      "https://open.spotify.com/show/show-1",
    );
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("calls onClose when the header button is clicked", async () => {
    const onClose = jest.fn();
    const playback = mapTrackNowPlaying(mockTrack, mockNowPlayingTrack);
    const user = userEvent.setup();

    renderNowPlayingScreen(playback, { onClose });

    await user.click(screen.getByRole("button", { name: "Close player" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
