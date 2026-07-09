"use client";

import type { FC, MouseEvent } from "react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  memo,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { IoPause, IoPlay, IoVolumeMediumOutline } from "react-icons/io5";

import { useOutsideClick } from "@/hooks/use-outside-click";

import type { SpotifyPlayback } from "./types";
import ProgressTimer from "./progress-timer";
import Player from "./player";
import PlayingIndicator from "./playing-indicator";
import AnimatedGradient from "./animated-gradient";
import IPhoneMockup from "./iphone-mockup";
import SpotifyNowPlayingScreen from "./spotify-now-playing-screen";
import { formatPlayedAt } from "./format-played-at";
import { useAlbumColor } from "./use-album-color";
import {
  captureExpandRects,
  getExpandedTargets,
  type ExpandRects,
} from "./expand-rects";
import { useDragToClose } from "./use-drag-to-close";
import { usePlaybackClock } from "./use-playback-clock";
import {
  SPOTIFY_BACKDROP_TRANSITION,
  SPOTIFY_LAYOUT_SPRING,
  SPOTIFY_PANEL_SPRING,
} from "./animation";

interface ExpandableSpotifyPlayerProps {
  playback: SpotifyPlayback;
}

const ExpandableSpotifyPlayer: FC<ExpandableSpotifyPlayerProps> = ({
  playback,
}) => {
  const t = useTranslations("global.footer");
  const locale = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [expandRects, setExpandRects] = useState<ExpandRects | null>(null);
  const [flyTargets, setFlyTargets] = useState<ReturnType<
    typeof getExpandedTargets
  > | null>(null);
  const [flyComplete, setFlyComplete] = useState(false);
  const [localVolume, setLocalVolume] = useState(50);
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  const coverRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLAnchorElement>(null);
  const artistRef = useRef<HTMLAnchorElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const accentColor = useAlbumColor(playback.imageUrl);
  const hasPreview = Boolean(playback.previewUrl);
  const isRecentlyPlayed = playback.source === "recently_played";
  const isSpotifyPlaying =
    playback.source === "now_playing" && playback.isPlaying;
  // Keep ticking while collapsed so lyrics/progress stay in sync on reopen.
  const liveProgressMs = usePlaybackClock(
    playback.progressMs,
    playback.durationMs,
    isSpotifyPlaying,
  );

  const closeExpandedState = useCallback(() => {
    setIsExpanded(false);
    setFlyComplete(false);
    setFlyTargets(null);
    setExpandRects(null);
  }, []);

  const { y, resetDrag, dragProps } = useDragToClose(
    closeExpandedState,
    isExpanded,
  );

  const closeExpanded = useCallback(() => {
    resetDrag();
    closeExpandedState();
  }, [resetDrag, closeExpandedState]);

  useOutsideClick(expandedRef, closeExpanded);

  useEffect(() => {
    if (!isExpanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded || !screenRef.current) return;

    const frame = requestAnimationFrame(() => {
      if (!screenRef.current) return;
      setFlyTargets(
        getExpandedTargets(screenRef.current.getBoundingClientRect()),
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded || !expandRects || !flyTargets) return;

    const timer = window.setTimeout(() => setFlyComplete(true), 400);
    return () => clearTimeout(timer);
  }, [isExpanded, expandRects, flyTargets]);

  const togglePlayPause = (event: MouseEvent) => {
    event.stopPropagation();
    setIsLocalPlaying((prev) => !prev);
  };

  const openExpanded = () => {
    resetDrag();
    setFlyComplete(false);
    const rects = captureExpandRects({
      cover: coverRef.current,
      title: titleRef.current,
      artist: artistRef.current,
    });
    setExpandRects(rects);
    setIsExpanded(true);
    if (!rects) {
      setFlyComplete(true);
    }
  };

  const showFlyingLayer =
    isExpanded && expandRects && flyTargets && !flyComplete;

  return (
    <>
      <article
        aria-hidden={isExpanded}
        className="relative w-full overflow-hidden rounded-lg text-white"
        style={{ pointerEvents: isExpanded ? "none" : "auto" }}
      >
        <AnimatedGradient accentColor={accentColor} />

        <div className="relative flex items-center gap-3 p-3">
          <button
            type="button"
            onClick={openExpanded}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openExpanded();
              }
            }}
            aria-label={t("spotify.fullscreen.expand")}
            className="absolute inset-0 z-0 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          />

          <div
            ref={coverRef}
            className="pointer-events-none relative z-10 shrink-0"
            style={{ opacity: isExpanded ? 0 : 1 }}
          >
            <Image
              src={playback.imageUrl ?? "/images/spotify.png"}
              alt={playback.imageAlt}
              width={64}
              height={64}
              className="size-16 rounded-lg object-cover shadow-lg"
            />
            {playback.isPlaying && <PlayingIndicator color={accentColor} />}
          </div>

          <div className="relative z-10 min-w-0 flex-1">
            {isRecentlyPlayed && (
              <RecentlyPlayedNotice
                playedAt={playback.playedAt}
                locale={locale}
                compact
              />
            )}

            <a
              ref={titleRef}
              href={playback.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={playback.title}
              onClick={(event) => event.stopPropagation()}
              className="relative z-10 mt-0.5 block truncate text-sm leading-tight font-bold text-white hover:underline"
              style={{ opacity: isExpanded ? 0 : 1 }}
            >
              {playback.title}
            </a>

            <a
              ref={artistRef}
              href={playback.subtitleUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={playback.subtitle}
              onClick={(event) => event.stopPropagation()}
              className="relative z-10 mt-0.5 block truncate text-xs text-white/60 hover:text-white/80 hover:underline"
              style={{ opacity: isExpanded ? 0 : 1 }}
            >
              {playback.subtitle}
            </a>

            {playback.source === "now_playing" && (
              <div
                className="relative z-10"
                onClick={(event) => event.stopPropagation()}
              >
                <Player
                  isHidden={!isLocalPlaying || !hasPreview}
                  audioSrc={playback.previewUrl}
                  isLocalPlaying={isLocalPlaying}
                  onChange={setIsLocalPlaying}
                  volume={localVolume}
                  accentColor={accentColor}
                />
                <ProgressTimer
                  isHidden={isLocalPlaying && hasPreview}
                  progressMs={playback.progressMs}
                  durationMs={playback.durationMs}
                  isPlaying={playback.isPlaying}
                  accentColor={accentColor}
                />
              </div>
            )}
          </div>

          {hasPreview && (
            <div className="relative z-10 shrink-0">
              <button
                type="button"
                onClick={togglePlayPause}
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
                className="flex size-9 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
                aria-label={
                  isLocalPlaying
                    ? t("spotify.buttons.pause")
                    : t("spotify.buttons.play")
                }
              >
                {isLocalPlaying ? (
                  <IoPause size={18} />
                ) : (
                  <IoPlay size={18} className="ml-0.5" />
                )}
              </button>

              {showVolume && isLocalPlaying && (
                <div
                  className="absolute right-0 bottom-full mb-2 flex w-28 items-center gap-1.5 rounded-full bg-[#282828] px-2.5 py-1.5 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <IoVolumeMediumOutline
                    size={14}
                    className="shrink-0 text-white/70"
                  />
                  <input
                    type="range"
                    value={localVolume}
                    title={t("spotify.buttons.volume")}
                    onChange={(e) => setLocalVolume(Number(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
                    min={0}
                    max={100}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </article>

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isExpanded && (
              <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={SPOTIFY_BACKDROP_TRANSITION}
                  aria-label={t("spotify.fullscreen.close")}
                  className="absolute inset-0 bg-black/75"
                  onClick={closeExpanded}
                />

                {showFlyingLayer && (
                  <>
                    <motion.div
                      className="pointer-events-none fixed z-102 overflow-hidden shadow-2xl"
                      style={{ y }}
                      initial={{
                        top: expandRects.cover.top,
                        left: expandRects.cover.left,
                        width: expandRects.cover.width,
                        height: expandRects.cover.height,
                        borderRadius: 4,
                      }}
                      animate={{
                        top: flyTargets.cover.top,
                        left: flyTargets.cover.left,
                        width: flyTargets.cover.width,
                        height: flyTargets.cover.height,
                        borderRadius: 8,
                      }}
                      exit={{
                        top: expandRects.cover.top,
                        left: expandRects.cover.left,
                        width: expandRects.cover.width,
                        height: expandRects.cover.height,
                        borderRadius: 4,
                      }}
                      transition={SPOTIFY_LAYOUT_SPRING}
                    >
                      <Image
                        src={playback.imageUrl ?? "/images/spotify.png"}
                        alt={playback.imageAlt}
                        fill
                        draggable={false}
                        className="pointer-events-none object-cover select-none"
                        sizes="220px"
                      />
                    </motion.div>

                    <motion.p
                      className="pointer-events-none fixed z-102 truncate font-bold text-white"
                      style={{ y }}
                      initial={{
                        top: expandRects.title.top,
                        left: expandRects.title.left,
                        width: expandRects.title.width,
                        fontSize: 14,
                        lineHeight: 1.25,
                      }}
                      animate={{
                        top: flyTargets.title.top,
                        left: flyTargets.title.left,
                        width: flyTargets.title.width,
                        fontSize: 17,
                        lineHeight: 1.25,
                      }}
                      exit={{
                        top: expandRects.title.top,
                        left: expandRects.title.left,
                        width: expandRects.title.width,
                        fontSize: 14,
                        lineHeight: 1.25,
                      }}
                      transition={SPOTIFY_LAYOUT_SPRING}
                    >
                      {playback.title}
                    </motion.p>

                    <motion.p
                      className="pointer-events-none fixed z-102 truncate text-white/70"
                      style={{ y }}
                      initial={{
                        top: expandRects.artist.top,
                        left: expandRects.artist.left,
                        width: expandRects.artist.width,
                        fontSize: 12,
                        lineHeight: 1.25,
                      }}
                      animate={{
                        top: flyTargets.artist.top,
                        left: flyTargets.artist.left,
                        width: flyTargets.artist.width,
                        fontSize: 13,
                        lineHeight: 1.25,
                      }}
                      exit={{
                        top: expandRects.artist.top,
                        left: expandRects.artist.left,
                        width: expandRects.artist.width,
                        fontSize: 12,
                        lineHeight: 1.25,
                      }}
                      transition={SPOTIFY_LAYOUT_SPRING}
                    >
                      {playback.subtitle}
                    </motion.p>
                  </>
                )}

                <motion.div
                  ref={expandedRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={SPOTIFY_PANEL_SPRING}
                  className="relative z-101 will-change-transform"
                >
                  <IPhoneMockup screenRef={screenRef}>
                    <SpotifyNowPlayingScreen
                      playback={playback}
                      liveProgressMs={liveProgressMs}
                      accentColor={accentColor}
                      locale={locale}
                      flyComplete={flyComplete}
                      coverSize={flyTargets?.cover.width}
                      dragY={y}
                      dragProps={dragProps}
                      onClose={closeExpanded}
                    />
                  </IPhoneMockup>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

interface RecentlyPlayedNoticeProps {
  playedAt?: string;
  locale: string;
  compact?: boolean;
}

const RecentlyPlayedNotice: FC<RecentlyPlayedNoticeProps> = ({
  playedAt,
  locale,
  compact = false,
}) => {
  const t = useTranslations("global.footer");
  const playedAtLabel = playedAt ? formatPlayedAt(playedAt, locale) : null;

  return (
    <div className={compact ? "mb-1" : "mb-2 text-center"}>
      <p
        className={
          compact
            ? "text-[0.625rem] font-medium text-amber-300/90"
            : "text-xs font-medium text-amber-300/90"
        }
      >
        {t("spotify.notPlayingNow")}
      </p>
      <p
        className={
          compact ? "text-[0.625rem] text-white/55" : "text-xs text-white/60"
        }
      >
        {t("spotify.lastPlayed")}
        {playedAtLabel ? ` · ${playedAtLabel}` : ""}
      </p>
    </div>
  );
};

export default memo(ExpandableSpotifyPlayer);
