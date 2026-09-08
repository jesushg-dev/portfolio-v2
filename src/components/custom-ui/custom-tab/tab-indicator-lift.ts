export const TAB_INDICATOR_LIFT_ALONG = 1.06;
/** Tailwind spacing `2` (0.5rem). Converted to CSS px at use time. */
export const TAB_INDICATOR_OVERFLOW_REM = 0.5;
export const TAB_INDICATOR_GLOW_OPACITY = 0.55;

export function remToPx(rem: number): number {
  if (typeof document === "undefined") {
    return rem * 16;
  }

  const fontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  return rem * (Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 16);
}

export function getTabIndicatorOverflowPx(): number {
  return remToPx(TAB_INDICATOR_OVERFLOW_REM);
}

export function getTabIndicatorLiftScale(
  vertical: boolean,
  width: number,
  height: number,
) {
  const acrossSize = vertical ? width : height;
  const alongSize = vertical ? height : width;
  const overflowPx = getTabIndicatorOverflowPx();
  const acrossScale =
    acrossSize > 0 ? (acrossSize + 2 * overflowPx) / acrossSize : 1;
  const alongScale = alongSize > 0 ? TAB_INDICATOR_LIFT_ALONG : 1;

  if (vertical) {
    return {
      scaleX: acrossScale,
      scaleY: alongScale,
    };
  }

  return {
    scaleX: alongScale,
    scaleY: acrossScale,
  };
}
