"use client";

import { useState } from "react";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";

import { resolveProgressOnTrackChange } from "./resolve-track-progress";

type TrackSnapshot = {
  contentId: string;
  progressMs: number;
  durationMs: number;
};

function createTrackSnapshot(
  contentId: string,
  progressMs: number,
  durationMs: number,
): TrackSnapshot {
  return { contentId, progressMs, durationMs };
}

/**
 * Local progress ticker. Resyncs when Spotify polls a new progressMs.
 */
export function usePlaybackClock(
  contentId: string,
  progressMs: number,
  durationMs: number,
  isPlaying: boolean,
): number {
  const [clock, setClock] = useState(() => ({
    trackId: contentId,
    currentMs: progressMs,
    syncedProgressMs: progressMs,
    previousTrack: createTrackSnapshot(contentId, progressMs, durationMs),
  }));

  if (contentId !== clock.trackId) {
    const nextProgressMs = resolveProgressOnTrackChange(
      progressMs,
      durationMs,
      clock.previousTrack.progressMs,
      clock.previousTrack.durationMs,
    );

    setClock({
      trackId: contentId,
      currentMs: nextProgressMs,
      syncedProgressMs: progressMs,
      previousTrack: createTrackSnapshot(contentId, nextProgressMs, durationMs),
    });
  } else if (progressMs !== clock.syncedProgressMs) {
    setClock({
      trackId: contentId,
      currentMs: progressMs,
      syncedProgressMs: progressMs,
      previousTrack: createTrackSnapshot(contentId, progressMs, durationMs),
    });
  }

  useInterval(() => {
    if (!isPlaying) return;

    setClock((prev) => {
      const nextMs = Math.min(prev.currentMs + ETime.SECOND, durationMs);

      return {
        ...prev,
        currentMs: nextMs,
        previousTrack: createTrackSnapshot(prev.trackId, nextMs, durationMs),
      };
    });
  }, ETime.SECOND);

  return clock.currentMs;
}
