"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAudioPlayer } from "react-use-audio-player";

import useInterval from "@/hooks/use-interval";
import { ETime } from "@/utils/constants/times";
import { convertMsToMmSs } from "@/utils/tools/time";

import ProgressBar from "./progress-bar";

interface PlayerProps {
  isLocalPlaying: boolean;
  onChange: (isLocalPlaying: boolean) => void;
  isHidden?: boolean;
  audioSrc?: string | null;
  volume?: number;
  accentColor?: string;
}

export const Player: FC<PlayerProps> = ({
  audioSrc,
  isLocalPlaying,
  onChange,
  isHidden = false,
  volume = 0.2,
  accentColor,
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

  const handleSeek = (value: number) => {
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
  }, [audioSrc, load, volume]);

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
      <div className="mt-2">
        <ProgressBar
          value={crtProgressPercentage}
          accentColor={accentColor}
          onChange={handleSeek}
          ariaLabel={t("spotify.progressLabel")}
        />
      </div>
      <div className="mt-1.5 flex w-full justify-between">
        <time
          dateTime={`PT${Math.floor(crtProgress / 1000)}S`}
          className="text-[11px] text-white/80 tabular-nums select-none"
        >
          {convertMsToMmSs(crtProgress)}
        </time>
        <time
          dateTime={`PT${Math.floor(duration * 1000)}S`}
          className="text-[11px] text-white/80 tabular-nums select-none"
        >
          {convertMsToMmSs(duration * ETime.SECOND)}
        </time>
      </div>
    </div>
  );
};

export default Player;
