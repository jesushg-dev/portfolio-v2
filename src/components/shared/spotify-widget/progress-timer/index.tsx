import { useTranslations } from "next-intl";
import type { FC } from "react";

import { convertMsToMmSs } from "@/utils/tools/time";

import ProgressBar from "../progress-bar";

interface IProgressTimer {
  progressMs: number;
  durationMs: number;
  isHidden?: boolean;
  accentColor?: string;
}

/** Displays wall-clock progress supplied by SpotifyPlaybackProvider. */
const ProgressTimer: FC<IProgressTimer> = ({
  progressMs,
  durationMs,
  isHidden = false,
  accentColor,
}) => {
  const t = useTranslations("global.footer");
  const currentMs = Math.min(progressMs, durationMs);
  const progressPercentage =
    durationMs > 0 ? Math.min(100, (currentMs / durationMs) * 100) : 0;

  return (
    <div className={`w-full transition-all ${isHidden ? "hidden" : ""}`}>
      <div className="mt-2">
        <ProgressBar
          value={progressPercentage}
          accentColor={accentColor}
          readOnly
        />
      </div>
      <div className="mt-1.5 flex w-full justify-between">
        <p
          title={t("spotify.hints.currentProgress")}
          className="text-[11px] text-white/50 tabular-nums select-none"
        >
          {convertMsToMmSs(currentMs)}
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
