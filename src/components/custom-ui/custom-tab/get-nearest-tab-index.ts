export interface TabRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getNearestTabIndex(
  point: { x: number; y: number },
  rects: readonly (TabRect | undefined | null)[],
  axis: "x" | "y" = "x",
): number {
  if (rects.length === 0) return 0;

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < rects.length; index += 1) {
    const rect = rects[index];
    if (!rect) continue;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance =
      axis === "x" ? Math.abs(point.x - centerX) : Math.abs(point.y - centerY);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}
