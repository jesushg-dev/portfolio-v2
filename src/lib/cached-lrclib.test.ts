import { buildLyricsServerCacheKey } from "@/lib/lyrics-cache-key";
import { getCachedLrclibLyrics } from "./cached-lrclib";
import { resolveLrclibLyrics } from "@/lib/lrclib";

jest.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock("@/lib/lrclib", () => ({
  resolveLrclibLyrics: jest.fn(),
}));

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

describe("getCachedLrclibLyrics", () => {
  const baseParams = {
    cacheKey: "key-123",
    artistName: "Artist",
    trackName: "Track",
  };

  it("returns lyrics when resolveLrclibLyrics returns a valid result", async () => {
    const mockResult = { syncedLyrics: "line 1", plainLyrics: "line 1" };
    (resolveLrclibLyrics as jest.Mock).mockResolvedValueOnce(mockResult);

    const res = await getCachedLrclibLyrics(baseParams);
    expect(res).toEqual(mockResult);
  });

  it("returns null when resolveLrclibLyrics returns null (LyricsNotFoundError)", async () => {
    (resolveLrclibLyrics as jest.Mock).mockResolvedValueOnce(null);

    const res = await getCachedLrclibLyrics(baseParams);
    expect(res).toBeNull();
  });

  it("re-throws non-LyricsNotFoundError exceptions", async () => {
    (resolveLrclibLyrics as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    await expect(getCachedLrclibLyrics(baseParams)).rejects.toThrow("Network Error");
  });
});

