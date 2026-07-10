"use client";

import { useEffect, useRef } from "react";

import { prefetchTrackLyrics } from "./use-track-lyrics";
import { SPOTIFY_NEAR_END_MS } from "./spotify-timing";
import type { TrackLyricsRequest } from "./track-lyrics-types";

export function usePrefetchNextLyrics({
  currentContentId,
  nextTrack,
  liveProgressMs,
  durationMs,
  isPlaying,
}: {
  currentContentId: string;
  nextTrack: TrackLyricsRequest | null;
  liveProgressMs: number;
  durationMs: number;
  isPlaying: boolean;
}): void {
  const prefetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    prefetchedIdRef.current = null;
  }, [currentContentId]);

  useEffect(() => {
    if (!nextTrack || !isPlaying) return;

    const remainingMs = durationMs - liveProgressMs;
    if (remainingMs > SPOTIFY_NEAR_END_MS) return;
    if (prefetchedIdRef.current === nextTrack.contentId) return;

    prefetchedIdRef.current = nextTrack.contentId;
    void prefetchTrackLyrics(nextTrack);
  }, [nextTrack, liveProgressMs, durationMs, isPlaying, currentContentId]);
}
