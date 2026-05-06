import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";
import { convertMsToMmSs } from "@/utils/tools/time";

interface IProgressTimer {
  progressMs: number;
  durationMs: number;
  isPlaying?: boolean;
  onFinish?: () => void;
  isHidden?: boolean;
}

const ProgressTimer: FC<IProgressTimer> = ({
  progressMs,
  durationMs,
  onFinish,
  isPlaying,
  isHidden = false,
}) => {
  const t = useTranslations("global.footer");

  const [crtProgress, setCrtProgress] = useState<number>(progressMs);
  const crtProgressPercentage = (crtProgress / durationMs) * 100;

  useInterval(() => {
    if (!isPlaying) return;
    setCrtProgress((prev) => {
      const next = prev + ETime.SECOND;
      if (next >= durationMs) onFinish?.();
      return next;
    });
  }, ETime.SECOND);

  return (
    <div className={`w-full transition-all ${isHidden ? "hidden" : ""}`}>
      <div className="mt-4 flex w-full justify-between">
        <p
          title={t("spotify.hints.currentProgress")}
          className="text-sm text-gray-500/90 select-none"
        >
          {convertMsToMmSs(crtProgress)}
        </p>
        <p
          title={t("spotify.hints.totalDuration")}
          className="pr-1 text-sm text-gray-400/90 select-none"
        >
          {convertMsToMmSs(durationMs)}
        </p>
      </div>
      <div className="relative my-3 flex w-full">
        <input
          title={t("spotify.hints.disabledExteralRange")}
          className="range-sm h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-green-600 bg-linear-to-r from-emerald-700 to-green-500"
          type="range"
          step="1"
          min="0"
          max="100"
          value={crtProgressPercentage}
          onChange={() => {
            // disabled
          }}
        />
      </div>
    </div>
  );
};

export default ProgressTimer;
