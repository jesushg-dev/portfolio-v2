import {
  captureExpandRects,
  EXPANDED_COVER_WIDTH_RATIO,
  getExpandedTargets,
  toElementRect,
} from "./expand-rects";

describe("toElementRect", () => {
  it("copies DOMRect values into a plain object", () => {
    const rect = {
      top: 10,
      left: 20,
      width: 64,
      height: 64,
    } as DOMRect;

    expect(toElementRect(rect)).toEqual({
      top: 10,
      left: 20,
      width: 64,
      height: 64,
    });
  });
});

describe("captureExpandRects", () => {
  it("returns null when any element is missing", () => {
    const element = document.createElement("div");

    expect(
      captureExpandRects({
        cover: element,
        title: null,
        artist: element,
      }),
    ).toBeNull();
  });

  it("captures bounding rects from all elements", () => {
    const cover = document.createElement("div");
    const title = document.createElement("a");
    const artist = document.createElement("a");

    jest.spyOn(cover, "getBoundingClientRect").mockReturnValue({
      top: 1,
      left: 2,
      width: 64,
      height: 64,
    } as DOMRect);
    jest.spyOn(title, "getBoundingClientRect").mockReturnValue({
      top: 3,
      left: 4,
      width: 200,
      height: 18,
    } as DOMRect);
    jest.spyOn(artist, "getBoundingClientRect").mockReturnValue({
      top: 5,
      left: 6,
      width: 200,
      height: 14,
    } as DOMRect);

    expect(
      captureExpandRects({ cover, title, artist }),
    ).toEqual({
      cover: { top: 1, left: 2, width: 64, height: 64 },
      title: { top: 3, left: 4, width: 200, height: 18 },
      artist: { top: 5, left: 6, width: 200, height: 14 },
    });
  });
});

describe("getExpandedTargets", () => {
  it("positions cover and text relative to the screen rect", () => {
    const screenRect = {
      top: 100,
      left: 50,
      width: 300,
      height: 600,
    } as DOMRect;

    const targets = getExpandedTargets(screenRect);
    const coverSize = screenRect.width * EXPANDED_COVER_WIDTH_RATIO;

    expect(targets.cover.width).toBe(coverSize);
    expect(targets.cover.height).toBe(coverSize);
    expect(targets.cover.left).toBe(
      screenRect.left + (screenRect.width - coverSize) / 2,
    );
    expect(targets.title.top).toBeGreaterThan(targets.cover.top);
    expect(targets.artist.top).toBeGreaterThan(targets.title.top);
  });
});
