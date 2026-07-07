import {
  buildSpotifyFullscreenBg,
  buildSpotifyGradient,
} from "./use-album-color";

describe("buildSpotifyGradient", () => {
  it("builds a multi-stop gradient using the accent color", () => {
    expect(buildSpotifyGradient("#1db954")).toBe(
      "linear-gradient(145deg, #1db954cc 0%, #1db95455 28%, #121212 72%, #191414 100%)",
    );
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
