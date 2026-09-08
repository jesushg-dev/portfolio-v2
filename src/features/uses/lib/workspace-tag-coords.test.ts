import { clampPercent, pointerToPercent } from "./workspace-tag-coords";

describe("clampPercent", () => {
  it("keeps values inside 0–100", () => {
    expect(clampPercent(42.5)).toBe(42.5);
  });

  it("clamps below 0 and above 100", () => {
    expect(clampPercent(-8)).toBe(0);
    expect(clampPercent(140)).toBe(100);
  });

  it("treats non-finite numbers as 0", () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("pointerToPercent", () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };

  it("maps the center of the box to 50/50", () => {
    expect(pointerToPercent(200, 100, rect)).toEqual({
      xPercent: 50,
      yPercent: 50,
    });
  });

  it("clamps pointers outside the box", () => {
    expect(pointerToPercent(0, 0, rect)).toEqual({
      xPercent: 0,
      yPercent: 0,
    });
    expect(pointerToPercent(800, 800, rect)).toEqual({
      xPercent: 100,
      yPercent: 100,
    });
  });

  it("returns 0 when the box has no size", () => {
    expect(
      pointerToPercent(10, 10, { left: 0, top: 0, width: 0, height: 0 }),
    ).toEqual({ xPercent: 0, yPercent: 0 });
  });
});
