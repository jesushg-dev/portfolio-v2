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

import ExpandableSpotifyPlayer from "./expandable-spotify-player";
import {
  mapEpisodeNowPlaying,
  mapRecentlyPlayed,
  mapTrackNowPlaying,
} from "./playback-mappers";

jest.mock("react-use-audio-player", () => ({
  useAudioPlayer: () => ({
    duration: 248,
    load: jest.fn(),
    getPosition: () => 0,
    play: jest.fn(),
    pause: jest.fn(),
    isPlaying: false,
    seek: jest.fn(),
    setVolume: jest.fn(),
  }),
}));

jest.mock("./use-album-color", () => ({
  useAlbumColor: () => "#1db954",
  buildSpotifyGradient: (hex: string) => `gradient(${hex})`,
  buildSpotifyFullscreenBg: (hex: string) => `fullscreen(${hex})`,
}));

function mockBoundingClientRect() {
  const rect = {
    top: 120,
    left: 40,
    width: 64,
    height: 64,
    right: 104,
    bottom: 184,
    x: 40,
    y: 120,
    toJSON: () => ({}),
  };

  Element.prototype.getBoundingClientRect = jest.fn(() => rect as DOMRect);
}

describe("ExpandableSpotifyPlayer", () => {
  beforeEach(() => {
    mockBoundingClientRect();
  });

  it("renders track links without nesting them inside the expand control", () => {
    const playback = mapTrackNowPlaying(mockTrack, mockNowPlayingTrack);

    renderWithIntl(<ExpandableSpotifyPlayer playback={playback} />);

    const titleLink = screen.getByRole("link", { name: "Get Lucky" });
    const artistLink = screen.getByRole("link", {
      name: "Daft Punk feat Pharrell Williams",
    });

    expect(titleLink).toHaveAttribute(
      "href",
      "https://open.spotify.com/track/track-1",
    );
    expect(artistLink).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/artist-1",
    );
    expect(
      screen.getByRole("button", { name: "Expand player" }),
    ).toBeInTheDocument();
  });

  it("opens the fullscreen player when the expand control is clicked", async () => {
    const user = userEvent.setup();
    const playback = mapTrackNowPlaying(mockTrack, mockNowPlayingTrack);

    renderWithIntl(<ExpandableSpotifyPlayer playback={playback} />);

    await user.click(screen.getByRole("button", { name: "Expand player" }));

    expect(screen.getByText("Now Playing")).toBeInTheDocument();
    expect(screen.getAllByText("Get Lucky").length).toBeGreaterThan(1);
  });

  it("shows recently played notice for history fallback", () => {
    const playback = mapRecentlyPlayed(mockRecentlyPlayed);

    renderWithIntl(<ExpandableSpotifyPlayer playback={playback!} />);

    expect(
      screen.getByText("Nothing is playing right now"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last played/)).toBeInTheDocument();
    expect(screen.queryByTitle("Current progress")).not.toBeInTheDocument();
  });

  it("renders podcast metadata with show link", () => {
    const playback = mapEpisodeNowPlaying(
      mockEpisode,
      mockNowPlayingEpisodeNullItem,
    );

    renderWithIntl(<ExpandableSpotifyPlayer playback={playback} />);

    expect(
      screen.getByRole("link", { name: "Taste the Cloud" }),
    ).toHaveAttribute("href", "https://open.spotify.com/episode/episode-1");
    expect(screen.getByRole("link", { name: "Syntax FM" })).toHaveAttribute(
      "href",
      "https://open.spotify.com/show/show-1",
    );
  });

  it("toggles local preview playback when preview url exists", async () => {
    const user = userEvent.setup();
    const playback = mapTrackNowPlaying(mockTrack, mockNowPlayingTrack);

    renderWithIntl(<ExpandableSpotifyPlayer playback={playback} />);

    const playButton = screen.getByRole("button", { name: "Play" });
    await user.click(playButton);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });
});
