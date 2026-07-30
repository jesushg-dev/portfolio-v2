import {
  mockExplicitTrack,
  mockNowPlayingTrack,
  mockRecentlyPlayed,
  mockRecentlyPlayedExplicit,
} from "@/test-utils/fixtures/spotify-data";

import { resolveSpotifyPlayback } from "./resolve-spotify-playback";

describe("resolveSpotifyPlayback", () => {
  it("falls back to recently played when the active track is explicit", () => {
    const playback = resolveSpotifyPlayback(
      {
        ...mockNowPlayingTrack,
        item: mockExplicitTrack,
      },
      undefined,
      mockRecentlyPlayed,
      false,
    );

    expect(playback?.source).toBe("recently_played");
    expect(playback?.title).toBe("Get Lucky");
  });

  it("returns null when active and recently played tracks are explicit", () => {
    const playback = resolveSpotifyPlayback(
      {
        ...mockNowPlayingTrack,
        item: mockExplicitTrack,
      },
      undefined,
      mockRecentlyPlayedExplicit,
      false,
    );

    expect(playback).toBeNull();
  });

  it("resolves paused track from nowPlaying when it is not explicit", () => {
    const playback = resolveSpotifyPlayback(
      {
        ...mockNowPlayingTrack,
        is_playing: false,
      },
      undefined,
      mockRecentlyPlayed,
      false,
    );

    expect(playback?.source).toBe("now_playing");
    expect(playback?.isPlaying).toBe(false);
  });

  it("falls back to recently played when paused track is explicit", () => {
    const playback = resolveSpotifyPlayback(
      {
        ...mockNowPlayingTrack,
        is_playing: false,
        item: mockExplicitTrack,
      },
      undefined,
      mockRecentlyPlayed,
      false,
    );

    expect(playback?.source).toBe("recently_played");
    expect(playback?.title).toBe("Get Lucky");
  });

  it("falls back to recently played when nowPlaying returns 204 empty response", () => {
    const playback = resolveSpotifyPlayback(
      { error: { status: 204 } },
      undefined,
      mockRecentlyPlayed,
      false,
    );

    expect(playback?.source).toBe("recently_played");
    expect(playback?.title).toBe("Get Lucky");
  });
});
