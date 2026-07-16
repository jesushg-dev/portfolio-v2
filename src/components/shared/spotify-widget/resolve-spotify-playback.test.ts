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
});
