import type { FC } from "react";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAudioPlayer } from "react-use-audio-player";

import useInterval from "@/hooks/useInterval";
import { ETime } from "@/utils/constants/times";
import { convertMsToMmSs } from "@/utils/tools/time";

interface IPlayer {
  isPlaying: boolean;
  onChange: (isPlaying: boolean) => void;
  isHidden?: boolean;
  audioSrc?: string | null;
  volume?: number;
}

// Player is same as ProgressTimer but user can control time, volume, slide volume bar and etc.
const Player: FC<IPlayer> = ({
  audioSrc,
  isPlaying,
  onChange,
  isHidden = false,
  volume = 0.2,
}) => {
  const t = useTranslations("global.footer");

  const player = useAudioPlayer();
  const { duration, load, getPosition, play, pause, playing, seek, setVolume } =
    player;

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
  }, [audioSrc, load]);

  useEffect(() => {
    const action = isPlaying ? play : pause;
    action();
  }, [isPlaying, play, pause]);

  useEffect(() => {
    onChange(playing);
  }, [playing, onChange]);

  useEffect(() => {
    const clampedVolume = volume / 100;
    setVolume(clampedVolume);
  }, [volume, setVolume]);

  useInterval(() => {
    if (!playing) return;
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
          className="select-none text-sm text-gray-500/90"
        >
          {convertMsToMmSs(crtProgress)}
        </p>
        <p
          title={t("spotify.hints.totalDuration")}
          className="select-none pr-1 text-sm text-gray-400/90"
        >
          {convertMsToMmSs(duration * ETime.SECOND)}
        </p>
      </div>

      <div className="relative my-3 flex w-full">
        <input
          title={t("spotify.hints.localRange")}
          className="range-sm h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-green-600 bg-gradient-to-r from-emerald-700 to-green-500"
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
