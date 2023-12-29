import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { FC } from 'react';

import useInterval from '@/hooks/useInterval';
import { ETime } from '@/utils/constants/times';
import { convertMsToMmSs } from '@/utils/tools/time';

interface IProgressTimer {
  progressMs: number;
  durationMs: number;
  isPlaying?: boolean;
  onFinish?: () => void;
  isHidden?: boolean;
}

const ProgressTimer: FC<IProgressTimer> = ({ progressMs, durationMs, onFinish, isPlaying, isHidden = false }) => {
  const t = useTranslations('global.footer');

  const [crtProgress, setCrtProgress] = useState<number>(progressMs);
  const [crtProgressPercentage, setCrtProgressPercentage] = useState<number>(0);

  useEffect(() => {
    setCrtProgress(progressMs);
  }, [progressMs]);

  useEffect(() => {
    setCrtProgressPercentage((crtProgress / durationMs) * 100);
    if (crtProgress >= durationMs) {
      onFinish?.();
    }
  }, [crtProgress, durationMs]);

  useInterval(() => {
    if (!isPlaying) return;
    setCrtProgress(crtProgress + ETime.SECOND);
  }, ETime.SECOND);

  return (
    <div className={`w-full transition-all ${isHidden ? 'hidden' : ''}`}>
      <div className="w-full flex justify-between mt-4">
        <p title={t('spotify.hints.currentProgress')} className="text-gray-500/90 text-sm select-none">
          {convertMsToMmSs(crtProgress)}
        </p>
        <p title={t('spotify.hints.totalDuration')} className="text-gray-400/90 text-sm select-none pr-1">
          {convertMsToMmSs(durationMs)}
        </p>
      </div>
      <div className="flex relative my-3 w-full">
        <input
          title={t('spotify.hints.disabledExteralRange')}
          className="w-full h-1.5 bg-green-600 bg-gradient-to-r from-emerald-700 to-green-500 rounded-lg appearance-none cursor-pointer range-sm"
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
