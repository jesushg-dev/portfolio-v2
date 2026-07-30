import { LrclibUpstreamError, resolveLrclibLyrics } from "./lrclib";

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("resolveLrclibLyrics", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  it("returns lyrics from exact signature match", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        plainLyrics: "Hello world",
        syncedLyrics: null,
      }),
    );

    const result = await resolveLrclibLyrics({
      artistName: "Artist",
      trackName: "Song",
      albumName: "Album",
      durationSeconds: 200,
    });

    expect(result).toEqual({
      plainLyrics: "Hello world",
      syncedLyrics: null,
      source: "lrclib",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to search when exact match is missing", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(null, 404))
      .mockResolvedValueOnce(
        mockResponse([{ plainLyrics: "From search", syncedLyrics: null }]),
      );

    const result = await resolveLrclibLyrics({
      artistName: "Artist",
      trackName: "Song",
      albumName: "Album",
      durationSeconds: 200,
    });

    expect(result?.plainLyrics).toBe("From search");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when LRCLIB times out on signature lookup", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ message: "Request timed out" }, 408),
    );

    await expect(
      resolveLrclibLyrics({
        artistName: "Lady Gaga",
        trackName: "Abracadabra",
        albumName: "MAYHEM",
        durationSeconds: 223,
      }),
    ).rejects.toBeInstanceOf(LrclibUpstreamError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
