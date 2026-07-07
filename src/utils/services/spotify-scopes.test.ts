import {
  getSpotifyQueryError,
  isInsufficientScopeError,
  resolveSpotifyUrl,
  SPOTIFY_REQUIRED_SCOPES,
} from "./spotify-scopes";

describe("SPOTIFY_REQUIRED_SCOPES", () => {
  it("includes scopes needed for now playing, queue, and recently played", () => {
    expect(SPOTIFY_REQUIRED_SCOPES).toEqual([
      "user-read-currently-playing",
      "user-read-playback-state",
      "user-read-recently-played",
    ]);
  });
});

describe("isInsufficientScopeError", () => {
  it("returns true for 403 scope errors", () => {
    expect(
      isInsufficientScopeError({
        error: {
          status: 403,
          message: "Insufficient client scope",
        },
      }),
    ).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(
      isInsufficientScopeError({
        error: { status: 401, message: "Unauthorized" },
      }),
    ).toBe(false);
    expect(isInsufficientScopeError(undefined)).toBe(false);
    expect(isInsufficientScopeError({})).toBe(false);
  });
});

describe("getSpotifyQueryError", () => {
  it("extracts API errors", () => {
    expect(
      getSpotifyQueryError({
        error: { status: 500, message: "Server error" },
      }),
    ).toEqual({ status: 500, message: "Server error" });
  });

  it("returns null for insufficient scope errors", () => {
    expect(
      getSpotifyQueryError({
        error: { status: 403, message: "Insufficient client scope" },
      }),
    ).toBeNull();
  });

  it("returns null for invalid payloads", () => {
    expect(getSpotifyQueryError(null)).toBeNull();
    expect(getSpotifyQueryError({ error: "bad" })).toBeNull();
  });
});

describe("resolveSpotifyUrl", () => {
  it("returns the first defined candidate", () => {
    expect(
      resolveSpotifyUrl(
        undefined,
        "https://open.spotify.com/track/1",
        "https://open.spotify.com/album/2",
      ),
    ).toBe("https://open.spotify.com/track/1");
  });

  it("falls back to open.spotify.com when no candidates exist", () => {
    expect(resolveSpotifyUrl(undefined, "")).toBe("https://open.spotify.com");
  });
});
