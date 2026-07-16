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
          ariaLabel={t("spotify.progressLabel")}
        />
      </div>
      <div className="mt-1.5 flex w-full justify-between">
        <time
          dateTime={`PT${Math.floor(currentMs / 1000)}S`}
          className="text-[11px] text-white/80 tabular-nums select-none"
        >
          {convertMsToMmSs(currentMs)}
        </time>
        <time
          dateTime={`PT${Math.floor(durationMs / 1000)}S`}
          className="text-[11px] text-white/80 tabular-nums select-none"
        >
          {convertMsToMmSs(durationMs)}
        </time>
      </div>
    </div>
  );
};

export default ProgressTimer;
