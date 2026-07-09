"use client";

import { useState } from "react";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";

/**
 * Local progress ticker. Resyncs when Spotify polls a new progressMs.
 * Pair with a parent `key={contentId}` remount so track changes start fresh.
 */
export function usePlaybackClock(
  progressMs: number,
  durationMs: number,
  isPlaying: boolean,
): number {
  const [currentMs, setCurrentMs] = useState(progressMs);
  const [syncedProgressMs, setSyncedProgressMs] = useState(progressMs);

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
