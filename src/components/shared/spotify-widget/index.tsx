"use client";

import type { FC } from "react";
import { memo } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import SpotifyWidgetSkeleton from "./spotify-widget-skeleton";
import ExpandableSpotifyPlayer from "./expandable-spotify-player";
import { useSpotifyPlayback } from "./hooks/use-spotify-playback";

const SpotifyWidget: FC = () => {
  const t = useTranslations("global.footer");
  const {
    playback,
    error,
    isLoading,
    isFetchError,
    nextTrackLyrics,
    nextTrackPlayback,
    onTrackEndReached,
  } = useSpotifyPlayback();

  if (isLoading) {
    return <SpotifyWidgetSkeleton />;
  }

  if (isFetchError || error || !playback) {
    return (
      <p
        className={cn(
          "rounded-lg bg-[#191414] p-4 text-center text-sm font-medium text-white/60",
        )}
      >
        {t("spotify.errors.noPlaying")}
      </p>
    );
  }

  return (
    <ExpandableSpotifyPlayer
      playback={playback}
      nextTrackLyrics={nextTrackLyrics}
      nextTrackPlayback={nextTrackPlayback}
      onTrackEndReached={onTrackEndReached}
    />
  );
};

export default memo(SpotifyWidget);
