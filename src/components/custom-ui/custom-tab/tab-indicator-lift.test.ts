import {
  getTabIndicatorLiftScale,
  getTabIndicatorOverflowPx,
  TAB_INDICATOR_LIFT_ALONG,
  TAB_INDICATOR_OVERFLOW_REM,
} from "./tab-indicator-lift";

describe("getTabIndicatorLiftScale", () => {
  it("makes the pill taller than the bar on a horizontal tablist", () => {
    const width = 88;
    const height = 40;
    const overflowPx = getTabIndicatorOverflowPx();
    const scale = getTabIndicatorLiftScale(false, width, height);

    expect(TAB_INDICATOR_OVERFLOW_REM).toBe(0.5);
    expect(scale.scaleX).toBe(TAB_INDICATOR_LIFT_ALONG);
    expect(scale.scaleY).toBe((height + 2 * overflowPx) / height);
    const liftedHeight = scale.scaleY * height;
    expect(liftedHeight).toBeGreaterThan(height);
    expect(liftedHeight).toBe(height + 2 * overflowPx);
  });

  it("makes the pill wider than the bar on a vertical tablist", () => {
    const width = 40;
    const height = 88;
    const overflowPx = getTabIndicatorOverflowPx();
    const scale = getTabIndicatorLiftScale(true, width, height);

    expect(scale).toEqual({
      scaleX: (width + 2 * overflowPx) / width,
      scaleY: TAB_INDICATOR_LIFT_ALONG,
    });
  });
});
