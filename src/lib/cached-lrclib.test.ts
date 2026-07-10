import { buildLyricsServerCacheKey } from "@/lib/lyrics-cache-key";

describe("buildLyricsServerCacheKey", () => {
  it("prefers spotify track id when available", () => {
    expect(
      buildLyricsServerCacheKey({
        spotifyId: "track-123",
        artist: "Artist",
        title: "Song",
        album: "Album",
        durationSeconds: 200,
      }),
    ).toBe("spotify:track-123");
  });

  it("falls back to artist title album duration signature", () => {
    expect(
      buildLyricsServerCacheKey({
        artist: "Daft Punk",
        title: "Get Lucky",
        album: "Random Access Memories",
        durationSeconds: 248,
      }),
    ).toBe("daft punk|get lucky|random access memories|248");
  });
});
