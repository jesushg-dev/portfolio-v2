import {
  buildSpotifyAccentOverlay,
  buildSpotifyFullscreenBg,
  SPOTIFY_PLAYER_BASE,
} from "./use-album-color";

describe("buildSpotifyAccentOverlay", () => {
  it("appends alpha to a solid accent color", () => {
    expect(buildSpotifyAccentOverlay("#1db954")).toBe("#1db95466");
    expect(buildSpotifyAccentOverlay("#1db954", 0.25)).toBe("#1db95440");
  });
});

describe("SPOTIFY_PLAYER_BASE", () => {
  it("uses Spotify dark base", () => {
    expect(SPOTIFY_PLAYER_BASE).toBe("#191414");
  });
});

describe("buildSpotifyFullscreenBg", () => {
  it("darkens the accent color for fullscreen backgrounds", () => {
    const background = buildSpotifyFullscreenBg("#1db954");

    expect(background).toMatch(
      /^linear-gradient\(180deg, #[0-9a-f]{6} 0%, #[0-9a-f]{6} 100%\)$/,
    );
    expect(background).not.toContain("#1db954");
  });
});
