export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function pointerToPercent(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { xPercent: number; yPercent: number } {
  const xPercent =
    rect.width === 0 ? 0 : ((clientX - rect.left) / rect.width) * 100;
  const yPercent =
    rect.height === 0 ? 0 : ((clientY - rect.top) / rect.height) * 100;

  return {
    xPercent: clampPercent(xPercent),
    yPercent: clampPercent(yPercent),
  };
}
