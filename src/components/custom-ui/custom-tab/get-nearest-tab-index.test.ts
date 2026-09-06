import { getNearestTabIndex, type TabRect } from "./get-nearest-tab-index";

const rects: TabRect[] = [
  { left: 0, top: 0, width: 100, height: 40 },
  { left: 120, top: 0, width: 100, height: 40 },
  { left: 240, top: 0, width: 100, height: 40 },
];

describe("getNearestTabIndex", () => {
  it("returns 0 when there are no rects", () => {
    expect(getNearestTabIndex({ x: 50, y: 20 }, [])).toBe(0);
  });

  it("returns the only tab when a single rect is provided", () => {
    expect(getNearestTabIndex({ x: 999, y: 999 }, [rects[0]])).toBe(0);
  });

  it("snaps to the first tab when the point is left of all tabs", () => {
    expect(getNearestTabIndex({ x: -80, y: 20 }, rects)).toBe(0);
  });

  it("snaps to the last tab when the point is right of all tabs", () => {
    expect(getNearestTabIndex({ x: 800, y: 20 }, rects)).toBe(2);
  });

  it("picks the tab whose center is closer when the point is between tabs", () => {
    expect(getNearestTabIndex({ x: 100, y: 20 }, rects)).toBe(0);
    expect(getNearestTabIndex({ x: 111, y: 20 }, rects)).toBe(1);
  });

  it("uses the vertical axis when requested", () => {
    const verticalRects: TabRect[] = [
      { left: 0, top: 0, width: 80, height: 40 },
      { left: 0, top: 60, width: 80, height: 40 },
    ];

    expect(getNearestTabIndex({ x: 40, y: -10 }, verticalRects, "y")).toBe(0);
    expect(getNearestTabIndex({ x: 40, y: 200 }, verticalRects, "y")).toBe(1);
  });
});
