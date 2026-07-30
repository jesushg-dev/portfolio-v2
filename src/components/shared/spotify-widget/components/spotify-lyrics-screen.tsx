"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";

import LyricsFullscreen from "./lyrics-fullscreen";
import { useTrackLyrics } from "../hooks/use-track-lyrics";
import { useSpotifyPlaybackContext } from "../context/spotify-playback-context";
import { useIOSNavigation } from "@/components/shared/ios-device";

interface SpotifyLyricsScreenProps {
  accentColor: string;
}

export const SpotifyLyricsScreen: FC<SpotifyLyricsScreenProps> = ({
  accentColor,
}) => {
  const { playback, liveProgressMs } = useSpotifyPlaybackContext();
  const { dismissSheet } = useIOSNavigation();
  const t = useTranslations("global.footer");

  const showLyrics = playback.contentType === "track";

  const lyricsState = useTrackLyrics({
    enabled: showLyrics,
    contentId: playback.contentId,
    title: playback.title,
    artist: playback.primaryArtist,
    album: playback.albumName,
    durationMs: playback.durationMs,
  });

  if (!lyricsState.lyrics) {
    return null;
  }

  return (
    <LyricsFullscreen
      key={playback.contentId}
      title={playback.title}
      artist={playback.subtitle}
      plainLyrics={lyricsState.lyrics.plainLyrics}
      syncedLyrics={lyricsState.lyrics.syncedLyrics}
      accentColor={accentColor}
      showProgress={playback.source === "now_playing"}
      progressMs={liveProgressMs}
      durationMs={playback.durationMs}
      backLabel={t("spotify.lyricsBack")}
      providedByLabel={t("spotify.lyricsProvidedBy", {
        provider: "LRCLIB",
      })}
      onBack={dismissSheet}
    />
  );
};

export default SpotifyLyricsScreen;
