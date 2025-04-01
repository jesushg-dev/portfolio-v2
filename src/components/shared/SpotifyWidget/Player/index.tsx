import type { FC } from "react";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAudioPlayer } from "react-use-audio-player";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";
import { convertMsToMmSs } from "@/utils/tools/time";

interface IPlayer {
  isLocalPlaying: boolean;
  onChange: (isLocalPlaying: boolean) => void;
  isHidden?: boolean;
  audioSrc?: string | null;
  volume?: number;
}

// Player is same as ProgressTimer but user can control time, volume, slide volume bar and etc.
const Player: FC<IPlayer> = ({
  audioSrc,
  isLocalPlaying,
  onChange,
  isHidden = false,
  volume = 0.2,
}) => {
  const t = useTranslations("global.footer");

  const player = useAudioPlayer();
  const {
    duration,
    load,
    getPosition,
    play,
    pause,
    isPlaying,
    seek,
    setVolume,
  } = player;

  const [crtProgress, setCrtProgress] = useState<number>(0);
  const [crtProgressPercentage, setCrtProgressPercentage] = useState<number>(0);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const percentage = value / 100;
    const seekTime = duration * percentage;
    seek(seekTime);
    setCrtProgress(percentage * duration);
    setCrtProgressPercentage(percentage * 100);
  };

  useEffect(() => {
    if (!audioSrc) return;
    const initialVolume = volume / 100;
    load(audioSrc, { initialVolume, html5: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc, load]);

  useEffect(() => {
    const action = isLocalPlaying ? play : pause;
    action();
  }, [isLocalPlaying, play, pause]);

  useEffect(() => {
    onChange(isPlaying);
  }, [isPlaying, onChange]);

  useEffect(() => {
    const clampedVolume = volume / 100;
    setVolume(clampedVolume);
  }, [volume, setVolume]);

  useInterval(() => {
    if (!isPlaying) return;
    const crtPosition = getPosition();
    const crtPositionMs = crtPosition * ETime.SECOND;
    setCrtProgress(crtPositionMs);
    setCrtProgressPercentage((crtPosition / duration) * 100);
  }, 1000);

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
          {convertMsToMmSs(duration * ETime.SECOND)}
        </p>
      </div>

      <div className="relative my-3 flex w-full">
        <input
          title={t("spotify.hints.localRange")}
          className="range-sm h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-green-600 bg-linear-to-r from-emerald-700 to-green-500"
          type="range"
          step="1"
          min="0"
          max="100"
          value={crtProgressPercentage}
          onChange={handleSeek}
        />
      </div>
    </div>
  );
};

export default Player;
