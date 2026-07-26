import { buildLyricsServerCacheKey } from "./lyrics-cache-key";

describe("buildLyricsServerCacheKey", () => {
  it("returns spotify prefix key when spotifyId is provided", () => {
    const key = buildLyricsServerCacheKey({
      spotifyId: "track123",
      artist: "Coldplay",
      title: "Yellow",
      album: "Parachutes",
    });
    expect(key).toBe("spotify:track123");
  });

  it("builds fallback composite key when spotifyId is missing", () => {
    const key = buildLyricsServerCacheKey({
      artist: "Coldplay",
      title: "Yellow",
      album: "Parachutes",
      durationSeconds: 268,
    });
    expect(key).toBe("coldplay|yellow|parachutes|268");
  });

  it("handles missing or <= 0 durationSeconds with '0' fallback", () => {
    const keyZero = buildLyricsServerCacheKey({
      artist: "Band",
      title: "Song",
      album: "Album",
      durationSeconds: 0,
    });
    expect(keyZero).toBe("band|song|album|0");

    const keyUndefined = buildLyricsServerCacheKey({
      artist: "Band",
      title: "Song",
      album: "Album",
    });
    expect(keyUndefined).toBe("band|song|album|0");

    const keyNegative = buildLyricsServerCacheKey({
      artist: "Band",
      title: "Song",
      album: "Album",
      durationSeconds: -5,
    });
    expect(keyNegative).toBe("band|song|album|0");
  });
});
