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
import type { SpotifyDragMotionValue } from "./use-drag-to-close";
import {
  mapEpisodeNowPlaying,
  mapRecentlyPlayed,
  mapTrackNowPlaying,
} from "./playback-mappers";

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

describe("SpotifyNowPlayingScreen", () => {
  it("renders now playing header and spotify links for a track", () => {
    const playback = mapTrackNowPlaying(mockTrack, mockNowPlayingTrack);

    renderWithIntl(
      <SpotifyNowPlayingScreen
        playback={playback}
        accentColor="#1db954"
        locale="en"
        flyComplete
        coverSize={220}
        dragY={motionY}
        dragProps={dragProps}
        onClose={jest.fn()}
      />,
    );

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

    renderWithIntl(
      <SpotifyNowPlayingScreen
        playback={playback!}
        accentColor="#191414"
        locale="en"
        flyComplete
        dragY={motionY}
        dragProps={dragProps}
        onClose={jest.fn()}
      />,
    );

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

    renderWithIntl(
      <SpotifyNowPlayingScreen
        playback={playback}
        accentColor="#191414"
        locale="en"
        flyComplete
        dragY={motionY}
        dragProps={dragProps}
        onClose={jest.fn()}
      />,
    );

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

    renderWithIntl(
      <SpotifyNowPlayingScreen
        playback={playback}
        accentColor="#1db954"
        locale="en"
        flyComplete
        dragY={motionY}
        dragProps={dragProps}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Close player" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
