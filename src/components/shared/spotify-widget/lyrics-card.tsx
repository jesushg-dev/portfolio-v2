"use client";

import { useLayoutEffect, useMemo, useRef, type FC } from "react";
import { Maximize2, MicOff } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { UseTrackLyricsResult } from "./use-track-lyrics";
import {
  findActiveLyricIndex,
  lyricPreviewWindow,
  parseLrc,
} from "./parse-lrc";
import { LyricLineContent } from "./lyric-line-content";

interface LyricsCardProps {
  accentColor: string;
  height: number;
  lyricsState: UseTrackLyricsResult;
  progressMs: number;
  labels: {
    title: string;
    loading: string;
    unavailable: string;
    expand: string;
  };
  onExpand: () => void;
}

/** Enough context above/below so the active line can sit in the visual middle. */
const PREVIEW_LINE_COUNT = 11;

const SKELETON_WIDTHS = ["92%", "78%", "88%", "70%", "84%", "62%"] as const;

function plainPreviewLines(plainLyrics: string, maxLines = 6): string[] {
  return plainLyrics
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(
      (line, index, arr) =>
        line.trim().length > 0 ||
        (index > 0 && Boolean(arr[index - 1]?.trim())),
    )
    .slice(0, maxLines);
}

const LyricsCard: FC<LyricsCardProps> = ({
  accentColor,
  height,
  lyricsState,
  progressMs,
  labels,
  onExpand,
}) => {
  const { status, lyrics } = lyricsState;
  const currentMs = progressMs;

  const syncedLines = useMemo(
    () => (lyrics?.syncedLyrics ? parseLrc(lyrics.syncedLyrics) : []),
    [lyrics],
  );

  const useSynced = syncedLines.length > 0;
  const activeIndex = useSynced
    ? findActiveLyricIndex(syncedLines, currentMs)
    : -1;

  const syncedPreview = useMemo(
    () => lyricPreviewWindow(syncedLines, activeIndex, PREVIEW_LINE_COUNT),
    [syncedLines, activeIndex],
  );

  const plainLines =
    status === "ready" && lyrics && !useSynced
      ? plainPreviewLines(lyrics.plainLyrics)
      : [];

  const canExpand =
    status === "ready" &&
    Boolean(lyrics) &&
    (useSynced ? syncedLines.length > 0 : plainLines.length > 0);

  const isLoading = status === "loading" || status === "idle";
  const isEmpty = status === "empty" || status === "error";

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    if (!useSynced || !canExpand) {
      track.style.transform = "translateY(0px)";
      return;
    }

    const viewport = viewportRef.current;
    const activeEl = activeLineRef.current;
    if (!viewport || !activeEl) return;

    const viewportCenter = viewport.clientHeight / 2;
    const activeCenter = activeEl.offsetTop + activeEl.offsetHeight / 2;
    track.style.transform = `translateY(${viewportCenter - activeCenter}px)`;
  }, [useSynced, canExpand, syncedPreview.activeOffset, syncedPreview.lines]);

  return (
    <button
      type="button"
      disabled={!canExpand}
      onClick={onExpand}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={canExpand ? labels.expand : undefined}
      aria-busy={isLoading || undefined}
      className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl text-left transition-opacity disabled:cursor-default"
      style={{
        height,
        background: `color-mix(in srgb, ${accentColor} 38%, rgba(0,0,0,0.62))`,
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2.5 pb-1.5">
        <p className="text-[0.65rem] font-bold tracking-wide text-white/90 uppercase">
          {labels.title}
        </p>
        {canExpand && (
          <Maximize2 className="size-3.5 shrink-0 text-white/70" aria-hidden />
        )}
      </div>

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-hidden px-3 pb-4"
      >
        {isLoading && (
          <div className="space-y-2.5 pt-0.5" aria-hidden>
            {SKELETON_WIDTHS.map((width, index) => (
              <Skeleton
                key={index}
                className="h-5 rounded-full bg-white/20"
                style={{ width }}
              />
            ))}
            <span className="sr-only">{labels.loading}</span>
          </div>
        )}

        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-2 text-center">
            <MicOff className="size-6 text-white/40" aria-hidden />
            <p className="text-[0.75rem] leading-snug font-medium text-white/55">
              {labels.unavailable}
            </p>
          </div>
        )}

        {canExpand && useSynced && (
          <div
            ref={trackRef}
            className="space-y-1.5 will-change-transform"
            style={{ transition: "transform 120ms ease-out" }}
          >
            {syncedPreview.lines.map((line, index) => {
              const isActive = index === syncedPreview.activeOffset;
              const isUpcoming =
                syncedPreview.activeOffset >= 0 &&
                index > syncedPreview.activeOffset;
              return (
                <p
                  key={`${line.timeMs}-${index}`}
                  ref={isActive ? activeLineRef : undefined}
                  className={
                    isUpcoming
                      ? "text-[1rem] leading-snug font-bold wrap-break-word text-white/35 transition-colors"
                      : "text-[1rem] leading-snug font-bold wrap-break-word text-white transition-colors"
                  }
                >
                  <LyricLineContent text={line.text} />
                </p>
              );
            })}
          </div>
        )}

        {canExpand && !useSynced && (
          <div className="space-y-1.5">
            {plainLines.map((line, index) => (
              <p
                key={`${index}-${line.slice(0, 24) || "gap"}`}
                className="text-[0.875rem] leading-snug font-bold wrap-break-word text-white/95"
              >
                <LyricLineContent text={line} />
              </p>
            ))}
          </div>
        )}

        {(canExpand || isLoading) && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-xl"
            style={{
              background: `linear-gradient(to top, color-mix(in srgb, ${accentColor} 38%, rgba(0,0,0,0.62)) 15%, transparent 100%)`,
            }}
          />
        )}
      </div>
    </button>
  );
};

export default LyricsCard;
