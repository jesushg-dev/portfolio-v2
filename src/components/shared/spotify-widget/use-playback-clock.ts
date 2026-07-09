"use client";

import { useEffect, useRef, useState } from "react";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";

/** Local progress ticker that resyncs when Spotify polls a new progressMs. */
export function usePlaybackClock(
  progressMs: number,
  durationMs: number,
  isPlaying: boolean,
): number {
  const [currentMs, setCurrentMs] = useState(progressMs);
  const syncedProgress = useRef(progressMs);

  useEffect(() => {
    if (syncedProgress.current !== progressMs) {
      syncedProgress.current = progressMs;
      setCurrentMs(progressMs);
    }
  }, [progressMs]);

  useInterval(() => {
    if (!isPlaying) return;
    setCurrentMs((prev) => Math.min(prev + ETime.SECOND, durationMs));
  }, ETime.SECOND);

  return currentMs;
}
