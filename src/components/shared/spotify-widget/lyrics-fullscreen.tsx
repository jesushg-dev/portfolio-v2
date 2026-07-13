"use client";

import { useEffect, useMemo, useRef, type FC } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

import SpotifyFullscreenProgress from "./spotify-fullscreen-progress";
import { buildSpotifyFullscreenBg } from "./use-album-color";
import { findActiveLyricIndex, parseLrc } from "./parse-lrc";
import { LyricLineContent } from "./lyric-line-content";

interface LyricsFullscreenProps {
  title: string;
  artist: string;
  plainLyrics: string;
  syncedLyrics: string | null;
  accentColor: string;
  showProgress: boolean;
  progressMs: number;
  durationMs: number;
  backLabel: string;
  providedByLabel: string;
  onBack: () => void;
}

const LyricsFullscreen: FC<LyricsFullscreenProps> = ({
  title,
  artist,
  plainLyrics,
  syncedLyrics,
  accentColor,
  showProgress,
  progressMs,
  durationMs,
  backLabel,
  providedByLabel,
  onBack,
}) => {
  const currentMs = progressMs;
  const syncedLines = useMemo(
    () => (syncedLyrics ? parseLrc(syncedLyrics) : []),
    [syncedLyrics],
  );
  const useSynced = syncedLines.length > 0;
  const activeIndex = useSynced
    ? findActiveLyricIndex(syncedLines, currentMs)
    : -1;

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const previousActiveIndexRef = useRef(activeIndex);

  useEffect(() => {
    if (!useSynced || activeIndex < 0) return;

    const jumpedToStart =
      previousActiveIndexRef.current >= 0 &&
      activeIndex < previousActiveIndexRef.current - 2;

    previousActiveIndexRef.current = activeIndex;

    activeLineRef.current?.scrollIntoView({
      behavior: jumpedToStart ? "instant" : "smooth",
      block: "center",
    });
  }, [activeIndex, useSynced]);

  const plainLines = useMemo(
    () =>
      plainLyrics
        .split("\n")
        .map((line) => line.trimEnd())
        .filter(
          (line, index, arr) =>
            line.length > 0 || (index > 0 && Boolean(arr[index - 1])),
        ),
    [plainLyrics],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-0 z-20 flex flex-col text-white"
      style={{ background: buildSpotifyFullscreenBg(accentColor) }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <header className="relative z-20 shrink-0 px-3.5 pt-[2.375rem] pb-2">
        <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex size-7 items-center justify-center text-white/90"
            aria-label={backLabel}
          >
            <ChevronDown className="size-5" strokeWidth={2.5} />
          </button>

          <div className="min-w-0 text-center">
            <p className="truncate text-[0.8125rem] font-bold text-white">
              {title}
            </p>
            <p className="truncate text-[0.65rem] text-white/70">{artist}</p>
          </div>

          <span className="size-7" aria-hidden />
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {useSynced ? (
          <div className="space-y-3">
            {syncedLines.map((line, index) => {
              const isActive = index === activeIndex;
              const isUpcoming = index > activeIndex;
              return (
                <p
                  key={`${line.timeMs}-${index}`}
                  ref={isActive ? activeLineRef : undefined}
                  className={
                    isUpcoming
                      ? "text-[1.25rem] leading-tight font-bold text-white/30 transition-colors"
                      : isActive
                        ? "text-[1.4rem] leading-tight font-bold text-white transition-colors"
                        : "text-[1.25rem] leading-tight font-bold text-white transition-colors"
                  }
                >
                  <LyricLineContent text={line.text} />
                </p>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {plainLines.map((line, index) => (
              <p
                key={`${index}-${line.slice(0, 24) || "gap"}`}
                className="text-[1.35rem] leading-tight font-bold text-white/90"
              >
                <LyricLineContent text={line} />
              </p>
            ))}
          </div>
        )}

        <p className="mt-8 pb-2 text-left text-[0.6875rem] text-white/45">
          {providedByLabel}
        </p>
      </div>

      {showProgress && (
        <div className="shrink-0 px-3.5 pt-1 pb-5">
          <SpotifyFullscreenProgress
            progressMs={progressMs}
            durationMs={durationMs}
          />
        </div>
      )}
    </motion.div>
  );
};

export default LyricsFullscreen;
