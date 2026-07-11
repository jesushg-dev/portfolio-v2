import { act, renderHook, waitFor } from "@testing-library/react";

import {
  buildLyricsCacheKey,
  clearLyricsCacheForTests,
  prefetchTrackLyrics,
  useTrackLyrics,
} from "./use-track-lyrics";

const mockFetch = jest.fn();

beforeEach(() => {
  clearLyricsCacheForTests();
  mockFetch.mockReset();
  global.fetch = mockFetch as typeof fetch;
});

const request = {
  contentId: "track-1",
  title: "Get Lucky",
  artist: "Daft Punk",
  album: "Random Access Memories",
  durationMs: 248_000,
};

function lyricsResponse(body: { plainLyrics: string; syncedLyrics: null }) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe("buildLyricsCacheKey", () => {
  it("uses spotify content id as the primary cache key", () => {
    expect(buildLyricsCacheKey(request)).toBe("spotify:track-1");
  });
});

describe("prefetchTrackLyrics", () => {
  it("deduplicates in-flight requests for the same track", async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve(
                lyricsResponse({
                  plainLyrics: "Line one",
                  syncedLyrics: null,
                }),
              ),
            20,
          );
        }),
    );

    await Promise.all([
      prefetchTrackLyrics(request),
      prefetchTrackLyrics(request),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("reuses cached lyrics on subsequent reads", async () => {
    mockFetch.mockResolvedValue(
      lyricsResponse({ plainLyrics: "Cached line", syncedLyrics: null }),
    );

    await prefetchTrackLyrics(request);

    const { result } = renderHook(() =>
      useTrackLyrics({ enabled: true, ...request }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.lyrics?.plainLyrics).toBe("Cached line");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("updates when prefetch completes before the hook is enabled", async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    mockFetch.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const prefetchPromise = prefetchTrackLyrics(request);

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useTrackLyrics({ enabled, ...request }),
      { initialProps: { enabled: false } },
    );

    expect(result.current.status).toBe("idle");

    await act(async () => {
      resolveFetch(
        lyricsResponse({ plainLyrics: "Late listener", syncedLyrics: null }),
      );
      await prefetchPromise;
    });

    rerender({ enabled: true });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.lyrics?.plainLyrics).toBe("Late listener");
  });

  it("retries a stale empty background prefetch when the UI becomes active", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Lyrics not found" }),
      })
      .mockResolvedValueOnce(
        lyricsResponse({ plainLyrics: "Retried line", syncedLyrics: null }),
      );

    await prefetchTrackLyrics(request);

    const { result } = renderHook(() =>
      useTrackLyrics({ enabled: true, ...request }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(result.current.lyrics?.plainLyrics).toBe("Retried line");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not persist empty misses to session storage", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Lyrics not found" }),
    });

    await prefetchTrackLyrics(request);

    expect(sessionStorage.getItem("spotify-lyrics-cache-v3")).toBeNull();
  });
});
