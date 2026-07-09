import {
  mockEpisode,
  mockNowPlayingEpisodeNullItem,
  mockNowPlayingIdle,
  mockNowPlayingTrack,
  mockNowPlayingTrackNullItem,
  mockQueueWithEpisode,
  mockQueueWithTrack,
  mockRecentlyPlayed,
  mockRecentlyPlayedExplicit,
  mockTrack,
} from "@/test-utils/fixtures/spotify-data";

import {
  isActiveEpisodePlayback,
  isActiveTrackPlayback,
  isEpisode,
  isTrack,
  mapEpisodeNowPlaying,
  mapRecentlyPlayed,
  mapTrackNowPlaying,
  needsQueueFallback,
  resolveEpisodeFromNowPlaying,
  resolveEpisodeFromQueue,
  resolveTrackFromNowPlaying,
  resolveTrackFromQueue,
} from "./playback-mappers";

describe("type guards", () => {
  it("identifies tracks and episodes", () => {
    expect(isTrack(mockTrack)).toBe(true);
    expect(isEpisode(mockTrack)).toBe(false);
    expect(isEpisode(mockEpisode)).toBe(true);
    expect(isTrack(mockEpisode)).toBe(false);
  });
});

describe("mapTrackNowPlaying", () => {
  it("maps track metadata and playback state", () => {
    const playback = mapTrackNowPlaying(mockTrack, mockNowPlayingTrack);

    expect(playback).toMatchObject({
      contentId: "track-1",
      snapshotTimestamp: mockNowPlayingTrack.timestamp,
      contentType: "track",
      source: "now_playing",
      title: "Get Lucky",
      subtitle: "Daft Punk feat Pharrell Williams",
      subtitleUrl: "https://open.spotify.com/artist/artist-1",
      primaryArtist: "Daft Punk",
      albumName: "Random Access Memories",
      contentUrl: "https://open.spotify.com/track/track-1",
      durationMs: 248_000,
      progressMs: 45_000,
      isPlaying: true,
      imageUrl: "https://i.scdn.co/image/album-cover",
      imageAlt: "Random Access Memories",
      previewUrl: "https://p.scdn.co/preview.mp3",
      deviceType: "smartphone",
    });
    expect(playback.context).toEqual({
      type: "playlist",
      url: "https://open.spotify.com/playlist/playlist-1",
    });
  });
});

describe("mapEpisodeNowPlaying", () => {
  it("maps episode metadata with show as subtitle", () => {
    const playback = mapEpisodeNowPlaying(
      mockEpisode,
      mockNowPlayingEpisodeNullItem,
    );

    expect(playback).toMatchObject({
      contentId: "episode-1",
      snapshotTimestamp: mockNowPlayingEpisodeNullItem.timestamp,
      contentType: "episode",
      source: "now_playing",
      title: "Taste the Cloud",
      subtitle: "Syntax FM",
      subtitleUrl: "https://open.spotify.com/show/show-1",
      primaryArtist: "Syntax FM",
      albumName: "Syntax FM",
      contentUrl: "https://open.spotify.com/episode/episode-1",
      imageUrl: "https://i.scdn.co/image/show-cover",
      progressMs: 60_000,
      isPlaying: true,
    });
  });

  it("uses resume point when progress_ms is null", () => {
    const playback = mapEpisodeNowPlaying(mockEpisode, {
      ...mockNowPlayingEpisodeNullItem,
      progress_ms: null,
    });

    expect(playback.progressMs).toBe(120_000);
  });
});

describe("mapRecentlyPlayed", () => {
  it("maps the most recent non-explicit track", () => {
    const playback = mapRecentlyPlayed(mockRecentlyPlayed);

    expect(playback).toMatchObject({
      contentId: "track-1",
      snapshotTimestamp: Date.parse("2024-01-15T10:30:00.000Z"),
      source: "recently_played",
      title: "Get Lucky",
      primaryArtist: "Daft Punk",
      albumName: "Random Access Memories",
      isPlaying: false,
      progressMs: 0,
      playedAt: "2024-01-15T10:30:00.000Z",
      contentUrl: "https://open.spotify.com/track/track-1",
    });
  });

  it("returns null for explicit tracks", () => {
    expect(mapRecentlyPlayed(mockRecentlyPlayedExplicit)).toBeNull();
  });

  it("returns null when history is empty", () => {
    expect(mapRecentlyPlayed({ ...mockRecentlyPlayed, items: [] })).toBeNull();
  });
});

describe("queue resolution", () => {
  it("resolves track from queue when currently playing is set", () => {
    expect(resolveTrackFromQueue(mockQueueWithTrack)).toBe(mockTrack);
  });

  it("resolves episode from queue when currently playing is set", () => {
    expect(resolveEpisodeFromQueue(mockQueueWithEpisode)).toBe(mockEpisode);
  });

  it("falls back to queued items when currently playing is missing", () => {
    expect(
      resolveTrackFromQueue({
        currently_playing: null,
        queue: [mockTrack],
      }),
    ).toBe(mockTrack);
  });
});

describe("now playing resolution helpers", () => {
  it("detects active track and episode playback", () => {
    expect(isActiveTrackPlayback(mockNowPlayingTrack)).toBe(true);
    expect(isActiveEpisodePlayback(mockNowPlayingEpisodeNullItem)).toBe(true);
    expect(isActiveTrackPlayback(mockNowPlayingIdle)).toBe(false);
  });

  it("flags queue fallback when item is null while playing", () => {
    expect(needsQueueFallback(mockNowPlayingTrackNullItem)).toBe(true);
    expect(needsQueueFallback(mockNowPlayingEpisodeNullItem)).toBe(true);
    expect(needsQueueFallback(mockNowPlayingIdle)).toBe(false);
  });

  it("resolves track and episode from now playing when item is present", () => {
    expect(resolveTrackFromNowPlaying(mockNowPlayingTrack)).toBe(mockTrack);
    expect(
      resolveEpisodeFromNowPlaying({
        ...mockNowPlayingEpisodeNullItem,
        item: mockEpisode,
      }),
    ).toBe(mockEpisode);
  });

  it("returns null for explicit items", () => {
    expect(
      resolveTrackFromNowPlaying({
        ...mockNowPlayingTrack,
        item: { ...mockTrack, explicit: true },
      }),
    ).toBeNull();
  });
});

describe("artist formatting and url fallbacks", () => {
  const [firstArtist, secondArtist] = mockTrack.artists;

  if (!firstArtist || !secondArtist) {
    throw new Error("Expected mock track artists");
  }

  it("formats three or more artists with an ampersand", () => {
    const track = {
      ...mockTrack,
      artists: [
        firstArtist,
        secondArtist,
        {
          ...firstArtist,
          id: "artist-3",
          name: "Nile Rodgers",
          external_urls: {
            spotify: "https://open.spotify.com/artist/artist-3",
          },
        },
      ],
    };

    const playback = mapTrackNowPlaying(track, mockNowPlayingTrack);
    expect(playback.subtitle).toBe(
      "Daft Punk, Pharrell Williams & Nile Rodgers",
    );
  });

  it("prefers album artists when the album lists more artists than the track", () => {
    const track = {
      ...mockTrack,
      artists: [firstArtist],
      album: {
        ...mockTrack.album,
        artists: [firstArtist, secondArtist],
      },
    };

    const playback = mapTrackNowPlaying(track, mockNowPlayingTrack);
    expect(playback.subtitle).toBe("Daft Punk feat Pharrell Williams");
  });

  it("falls back to open.spotify.com when urls are missing", () => {
    const track = {
      ...mockTrack,
      external_urls: { spotify: "" },
      artists: [
        {
          ...firstArtist,
          external_urls: { spotify: "" },
        },
      ],
    };

    const playback = mapTrackNowPlaying(track, mockNowPlayingTrack);

    expect(playback.contentUrl).toBe("https://open.spotify.com");
    expect(playback.subtitleUrl).toBe("https://open.spotify.com");
  });

  it("does not require queue fallback when item is already present", () => {
    expect(needsQueueFallback(mockNowPlayingTrack)).toBe(false);
  });

  it("resolves queued episode when currently playing is a track", () => {
    expect(
      resolveEpisodeFromQueue({
        currently_playing: mockTrack,
        queue: [mockEpisode],
      }),
    ).toBe(mockEpisode);
  });
});
