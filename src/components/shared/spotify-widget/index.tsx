"use client";

import type { FC } from "react";
import { memo } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import SpotifyWidgetSkeleton from "./spotify-widget-skeleton";
import ExpandableSpotifyPlayer from "./expandable-spotify-player";
import { useSpotifyPlayback } from "./use-spotify-playback";

const SpotifyWidget: FC = () => {
  const t = useTranslations("global.footer");
  const { playback, error, isLoading, isFetchError } = useSpotifyPlayback();

  if (isLoading) {
    return <SpotifyWidgetSkeleton />;
  }

  if (isFetchError) {
    return (
      <p className="rounded-lg bg-[#191414] p-4 text-center text-sm text-red-400">
        {t("spotify.errors.noFetch")}
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-[#191414] p-4 text-center text-sm text-red-400">
        Error: {error.message}
      </p>
    );
  }

  if (!playback) {
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

  return <ExpandableSpotifyPlayer playback={playback} />;
};

export default memo(SpotifyWidget);
