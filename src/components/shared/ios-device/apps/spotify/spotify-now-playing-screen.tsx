"use client";

import type { FC } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { SpotifyIcon } from "@/components/shared/brand-icons";
import { useIOSNavigation } from "@/components/shared/ios-device";

import SpotifyFullscreenProgress from "./spotify-fullscreen-progress";
import { buildSpotifyFullscreenBg } from "@/components/shared/spotify-widget/hooks/use-album-color";
import { formatPlayedAt } from "@/components/shared/spotify-widget/utils/format-played-at";
import LyricsCard from "./lyrics-card";
import SpotifyScrollingText from "@/components/shared/spotify-widget/components/spotify-scrolling-text";
import { useTrackLyrics } from "@/components/shared/spotify-widget/hooks/use-track-lyrics";
import { useSpotifyPlaybackContext } from "@/components/shared/spotify-widget/context/spotify-playback-context";
import type {
  SpotifyDragMotionValue,
  SpotifyDragToCloseProps,
} from "@/components/shared/spotify-widget/hooks/use-drag-to-close";

interface SpotifyNowPlayingScreenProps {
  accentColor: string;
  locale: string;
  flyComplete: boolean;
  dragY: SpotifyDragMotionValue;
  dragProps: SpotifyDragToCloseProps;
  onClose: () => void;
}

const SpotifyNowPlayingScreen: FC<SpotifyNowPlayingScreenProps> = ({
  accentColor,
  locale,
  flyComplete,
  dragY,
  dragProps,
  onClose,
}) => {
  const { playback, liveProgressMs } = useSpotifyPlaybackContext();
  const t = useTranslations("global.footer");
  const isRecentlyPlayed = playback.source === "recently_played";
  const showLyrics = playback.contentType === "track";
  const lyricsState = useTrackLyrics({
    enabled: showLyrics && flyComplete,
    contentId: playback.contentId,
    title: playback.title,
    artist: playback.primaryArtist,
    album: playback.albumName,
    durationMs: playback.durationMs,
  });

  const { presentSheet } = useIOSNavigation();

  return (
    <motion.div
      {...dragProps}
      style={{ y: dragY, background: buildSpotifyFullscreenBg(accentColor) }}
      className="relative flex size-full min-h-0 cursor-grab flex-col overflow-hidden text-white active:cursor-grabbing"
    >
      <header className="relative z-20 shrink-0 px-3.5 pt-9.5 pb-1">
        <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center text-white/90"
            aria-label={t("spotify.fullscreen.close")}
          >
            <ChevronDown className="size-5" strokeWidth={2.5} />
          </button>

          <p className="truncate text-center text-[0.70rem] font-semibold text-white/90">
            {isRecentlyPlayed
              ? t("spotify.lastPlayed")
              : t("titles.NowPlaying")}
          </p>

          <span className="size-7" aria-hidden />
        </div>
      </header>

      <div
        data-ios-texture-scroll
        className="min-h-0 flex-1 [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain px-3.5 pb-4"
        style={{ WebkitOverflowScrolling: "touch" }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {isRecentlyPlayed && (
          <p className="mb-2 text-center text-[0.625rem] text-amber-200/90">
            {t("spotify.notPlayingNow")}
            {playback.playedAt
              ? ` · ${formatPlayedAt(playback.playedAt, locale)}`
              : ""}
          </p>
        )}

        <div className="mx-auto w-full max-w-[15.3125rem] shrink-0">
          <div
            data-spotify-flight="cover"
            className="aspect-square w-full touch-none"
            style={{ opacity: flyComplete ? 1 : 0 }}
          >
            <Image
              src={playback.imageUrl ?? "/images/spotify.png"}
              alt={playback.imageAlt}
              width={256}
              height={256}
              draggable={false}
              className="pointer-events-none size-full rounded-[0.5rem] object-cover shadow-md select-none"
              preload
            />
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: flyComplete ? 1 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <a
              href={playback.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 mb-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[0.55rem] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/55"
            >
              <span className="flex size-3 items-center justify-center rounded-[0.1875rem] border border-white/80">
                <SpotifyIcon className="size-2.5" />
              </span>
              {t("spotify.fullscreen.openInSpotify")}
            </a>

            <a
              data-spotify-flight="title"
              href={playback.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden text-[1.0625rem] leading-snug font-bold text-white hover:underline"
              style={{ opacity: flyComplete ? 1 : 0 }}
            >
              <SpotifyScrollingText>{playback.title}</SpotifyScrollingText>
            </a>

            <a
              data-spotify-flight="artist"
              href={playback.subtitleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block overflow-hidden text-[0.8125rem] text-white/70 hover:text-white hover:underline"
              style={{ opacity: flyComplete ? 1 : 0 }}
            >
              <SpotifyScrollingText>{playback.subtitle}</SpotifyScrollingText>
            </a>

            {playback.source === "now_playing" && (
              <div className="mt-3">
                <SpotifyFullscreenProgress
                  progressMs={liveProgressMs}
                  durationMs={playback.durationMs}
                />
              </div>
            )}
          </motion.div>
          {showLyrics && flyComplete && (
            <div className="mt-3">
              <LyricsCard
                key={playback.contentId}
                accentColor={accentColor}
                lyricsState={lyricsState}
                progressMs={liveProgressMs}
                labels={{
                  title: t("spotify.lyrics"),
                  loading: t("spotify.lyricsLoading"),
                  notFound: t("spotify.lyricsNotFound"),
                  temporarilyUnavailable: t(
                    "spotify.lyricsTemporarilyUnavailable",
                  ),
                  expand: t("spotify.lyricsExpand"),
                }}
                onExpand={() => presentSheet("lyrics")}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SpotifyNowPlayingScreen;
