import { useEffect, useRef, useState } from "react";
import type { FC } from "react";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";
import { convertMsToMmSs } from "@/utils/tools/time";

interface SpotifyFullscreenProgressProps {
  progressMs: number;
  durationMs: number;
  isPlaying?: boolean;
}

const SpotifyFullscreenProgress: FC<SpotifyFullscreenProgressProps> = ({
  progressMs,
  durationMs,
  isPlaying,
}) => {
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

  const percentage = Math.min(100, (currentMs / durationMs) * 100);
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
