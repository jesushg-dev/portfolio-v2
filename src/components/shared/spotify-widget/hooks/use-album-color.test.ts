import { renderHook, act } from "@testing-library/react";
import {
  buildSpotifyAccentOverlay,
  buildSpotifyFullscreenBg,
  SPOTIFY_PLAYER_BASE,
  useAlbumPalette,
} from "./use-album-color";

describe("buildSpotifyAccentOverlay", () => {
  it("appends alpha to a solid accent color", () => {
    expect(buildSpotifyAccentOverlay("#1db954")).toBe("#1db95466");
    expect(buildSpotifyAccentOverlay("#1db954", 0.25)).toBe("#1db95440");
  });

  it("clamps alpha values below 0 and above 1", () => {
    expect(buildSpotifyAccentOverlay("#1db954", -0.5)).toBe("#1db95400");
    expect(buildSpotifyAccentOverlay("#1db954", 1.5)).toBe("#1db954ff");
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

describe("useAlbumPalette hook", () => {
  it("returns fallback color when imageUrl is undefined", () => {
    const { result } = renderHook(() => useAlbumPalette(undefined));
    expect(result.current.vibrant).toBe("#191414");
  });

  it("returns extracted color when image loads successfully", async () => {
    const originalImage = global.Image;
    const mockCtx = {
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray(64 * 64 * 4).fill(100),
      }),
    };

    const createElement = document.createElement.bind(document);
    jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        if (tagName === "canvas") {
          return {
            width: 0,
            height: 0,
            getContext: () => mockCtx,
          } as unknown as HTMLCanvasElement;
        }
        return createElement(tagName);
      });

    // Mock Image
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    }
    global.Image = MockImage as unknown as typeof globalThis.Image;

    const { result } = renderHook(() =>
      useAlbumPalette("https://example.com/cover.jpg"),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.vibrant).toBeDefined();

    global.Image = originalImage;
    jest.restoreAllMocks();
  });

  it("returns fallback color on image load error", async () => {
    const { result } = renderHook(() => useAlbumPalette("invalid-url.jpg"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.vibrant).toBe("#191414");
  });
});
