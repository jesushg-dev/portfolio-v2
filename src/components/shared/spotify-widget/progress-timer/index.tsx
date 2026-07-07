import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";
import { convertMsToMmSs } from "@/utils/tools/time";

import ProgressBar from "../progress-bar";

interface IProgressTimer {
  progressMs: number;
  durationMs: number;
  isPlaying?: boolean;
  isHidden?: boolean;
  accentColor?: string;
}

const ProgressTimer: FC<IProgressTimer> = ({
  progressMs,
  durationMs,
  isPlaying,
  isHidden = false,
  accentColor,
}) => {
  const t = useTranslations("global.footer");
  const [crtProgress, setCrtProgress] = useState<number>(progressMs);
  const hasSyncedProgress = useRef(progressMs);

  useEffect(() => {
    if (hasSyncedProgress.current !== progressMs) {
      hasSyncedProgress.current = progressMs;
      setCrtProgress(progressMs);
    }
  }, [progressMs]);

  const crtProgressPercentage = Math.min(100, (crtProgress / durationMs) * 100);

  useInterval(() => {
    if (!isPlaying) return;
    setCrtProgress((prev) => Math.min(prev + ETime.SECOND, durationMs));
  }, ETime.SECOND);

  return (
    <div className={`w-full transition-all ${isHidden ? "hidden" : ""}`}>
      <div className="mt-2">
        <ProgressBar
          value={crtProgressPercentage}
          accentColor={accentColor}
          readOnly
        />
      </div>
      <div className="mt-1.5 flex w-full justify-between">
        <p
          title={t("spotify.hints.currentProgress")}
          className="text-[11px] text-white/50 tabular-nums select-none"
        >
          {convertMsToMmSs(crtProgress)}
        </p>
        <p
          title={t("spotify.hints.totalDuration")}
          className="text-[11px] text-white/50 tabular-nums select-none"
        >
          {convertMsToMmSs(durationMs)}
        </p>
      </div>
    </div>
  );
};

export default ProgressTimer;
