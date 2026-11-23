import {
  captureExpandRects,
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

    expect(captureExpandRects({ cover, title, artist })).toEqual({
      cover: { top: 1, left: 2, width: 64, height: 64 },
      title: { top: 3, left: 4, width: 200, height: 18 },
      artist: { top: 5, left: 6, width: 200, height: 14 },
    });
  });
});

describe("getExpandedTargets", () => {
  it("positions cover and text relative to the screen rect", () => {
    const screen = document.createElement("div");
    screen.innerHTML =
      '<div data-spotify-flight="cover"></div><div data-spotify-flight="title"></div><div data-spotify-flight="artist"></div>';
    Object.defineProperties(screen, {
      offsetWidth: { value: 288 },
      offsetHeight: { value: 603 },
    });
    Array.from(screen.children).forEach((element, i) => {
      Object.defineProperties(element, {
        offsetParent: { value: screen },
        offsetLeft: { value: 22 },
        offsetTop: { value: [69, 362, 389][i] },
        offsetWidth: { value: 245 },
        offsetHeight: { value: i === 0 ? 245 : 24 },
      });
    });
    const targets = getExpandedTargets(screen);
    expect(targets?.cover.width).toBe(245);
    expect(targets?.cover.height).toBe(245);
    expect(targets?.cover.left).toBe(
      (document.documentElement.clientWidth - 288) / 2 + 22,
    );
    expect(targets?.title.top).toBeGreaterThan(targets?.cover.top ?? Infinity);
    expect(targets?.artist.top).toBeGreaterThan(targets?.title.top ?? Infinity);
  });
});
