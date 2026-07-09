"use client";

import type { FC } from "react";

import { convertMsToMmSs } from "@/utils/tools/time";

interface SpotifyFullscreenProgressProps {
  progressMs: number;
  durationMs: number;
  /** @deprecated Parent should pass a live wall-clock progress value. */
  isPlaying?: boolean;
}

/** Displays progress supplied by the parent playback clock. */
const SpotifyFullscreenProgress: FC<SpotifyFullscreenProgressProps> = ({
  progressMs,
  durationMs,
}) => {
  const currentMs = Math.min(progressMs, durationMs);
  const percentage =
    durationMs > 0 ? Math.min(100, (currentMs / durationMs) * 100) : 0;
  const remainingMs = Math.max(0, durationMs - currentMs);

  return (
    <div className="w-full">
      <div className="relative h-[0.1875rem] w-full rounded-full bg-white/35">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-1/2 size-[0.625rem] -translate-y-1/2 rounded-full bg-white shadow-sm"
          style={{ left: `calc(${percentage}% - 0.3125rem)` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[0.6875rem] text-white/75 tabular-nums">
        <span>{convertMsToMmSs(currentMs)}</span>
        <span>-{convertMsToMmSs(remainingMs)}</span>
      </div>
    </div>
  );
};

export default SpotifyFullscreenProgress;
