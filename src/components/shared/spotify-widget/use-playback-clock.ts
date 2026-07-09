"use client";

import { useState } from "react";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";

/**
 * Local progress ticker that resyncs when Spotify polls a new progressMs.
 * Kept alive on the compact player so lyrics stay in sync after close/reopen.
 */
export function usePlaybackClock(
  progressMs: number,
  durationMs: number,
  isPlaying: boolean,
): number {
  const [currentMs, setCurrentMs] = useState(progressMs);
  const [syncedProgressMs, setSyncedProgressMs] = useState(progressMs);

  // Adjust local state during render when Spotify reports a new snapshot.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (progressMs !== syncedProgressMs) {
    setSyncedProgressMs(progressMs);
    setCurrentMs(progressMs);
  }

  useInterval(() => {
    if (!isPlaying) return;
    setCurrentMs((prev) => Math.min(prev + ETime.SECOND, durationMs));
  }, ETime.SECOND);

  return currentMs;
}
