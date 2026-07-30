/** Detect progress that likely belongs to the previous track after a skip. */
export function isCarriedPlaybackProgress(
  progressMs: number,
  durationMs: number,
  previousProgressMs: number,
  previousDurationMs: number,
): boolean {
  if (previousDurationMs <= 0 || durationMs <= 0) return false;

  return (
    progressMs >= previousProgressMs * 0.9 && progressMs > durationMs * 0.5
  );
}

export function resolveProgressOnTrackChange(
  progressMs: number,
  durationMs: number,
  previousProgressMs: number,
  previousDurationMs: number,
): number {
  if (
    isCarriedPlaybackProgress(
      progressMs,
      durationMs,
      previousProgressMs,
      previousDurationMs,
    )
  ) {
    return 0;
  }

  return progressMs;
}
