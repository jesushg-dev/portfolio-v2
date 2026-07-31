"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import type { SpotifyPlayback } from "../types/types";
import type { TrackLyricsRequest } from "../types/track-lyrics-types";
import { usePlaybackClock } from "../hooks/use-playback-clock";
import { usePrefetchNextLyrics } from "../hooks/use-prefetch-next-lyrics";
import { prefetchTrackLyrics } from "../hooks/use-track-lyrics";

export interface SpotifyPlaybackContextValue {
  playback: SpotifyPlayback;
  liveProgressMs: number;
  isSpotifyPlaying: boolean;
  nextTrackLyrics: TrackLyricsRequest | null;
}

const SpotifyPlaybackContext =
  createContext<SpotifyPlaybackContextValue | null>(null);

interface SpotifyPlaybackProviderProps {
  playback: SpotifyPlayback;
  nextTrackLyrics?: TrackLyricsRequest | null;
  nextTrackPlayback?: SpotifyPlayback | null;
  onTrackEndReached?: () => void;
  children: ReactNode;
}

function resolveOptimisticPlayback(
  playback: SpotifyPlayback,
  nextTrackPlayback: SpotifyPlayback | null,
  sourceLiveProgressMs: number,
): SpotifyPlayback {
  if (
    playback.contentType !== "track" ||
    playback.source !== "now_playing" ||
    !nextTrackPlayback ||
    sourceLiveProgressMs < playback.durationMs
  ) {
    return playback;
  }

  return nextTrackPlayback;
}

function useEffectivePlaybackState(
  playback: SpotifyPlayback,
  nextTrackPlayback: SpotifyPlayback | null,
) {
  const sourceLiveProgressMs = usePlaybackClock(
    playback.contentId,
    playback.progressMs,
    playback.durationMs,
    playback.source === "now_playing" && playback.isPlaying,
  );

  const effectivePlayback = useMemo(
    () =>
      resolveOptimisticPlayback(
        playback,
        nextTrackPlayback,
        sourceLiveProgressMs,
      ),
    [playback, nextTrackPlayback, sourceLiveProgressMs],
  );

  const isOptimisticAdvance =
    effectivePlayback.contentId !== playback.contentId;

  const optimisticLiveProgressMs = usePlaybackClock(
    effectivePlayback.contentId,
    effectivePlayback.progressMs,
    effectivePlayback.durationMs,
    isOptimisticAdvance && effectivePlayback.isPlaying,
  );

  const liveProgressMs = isOptimisticAdvance
    ? optimisticLiveProgressMs
    : sourceLiveProgressMs;

  return { effectivePlayback, liveProgressMs, sourceLiveProgressMs };
}

function PlaybackClockBridge({
  playback,
  nextTrackLyrics = null,
  nextTrackPlayback = null,
  onTrackEndReached,
  children,
}: SpotifyPlaybackProviderProps) {
  const hasRequestedAdvanceRef = useRef(false);

  const { effectivePlayback, liveProgressMs, sourceLiveProgressMs } =
    useEffectivePlaybackState(playback, nextTrackPlayback);

  const isSpotifyPlaying =
    effectivePlayback.source === "now_playing" && effectivePlayback.isPlaying;

  useEffect(() => {
    hasRequestedAdvanceRef.current = false;
  }, [playback.contentId]);

  useEffect(() => {
    if (
      playback.contentType !== "track" ||
      playback.source !== "now_playing" ||
      sourceLiveProgressMs < playback.durationMs ||
      hasRequestedAdvanceRef.current
    ) {
      return;
    }

    hasRequestedAdvanceRef.current = true;
    onTrackEndReached?.();
  }, [sourceLiveProgressMs, playback, onTrackEndReached]);

  useEffect(() => {
    if (effectivePlayback.contentType !== "track") return;

    void prefetchTrackLyrics({
      contentId: effectivePlayback.contentId,
      title: effectivePlayback.title,
      artist: effectivePlayback.primaryArtist,
      album: effectivePlayback.albumName,
      durationMs: effectivePlayback.durationMs,
    });
  }, [
    effectivePlayback.contentId,
    effectivePlayback.contentType,
    effectivePlayback.title,
    effectivePlayback.primaryArtist,
    effectivePlayback.albumName,
    effectivePlayback.durationMs,
  ]);

  usePrefetchNextLyrics({
    currentContentId: effectivePlayback.contentId,
    nextTrack: nextTrackLyrics,
    liveProgressMs,
    durationMs: effectivePlayback.durationMs,
    isPlaying: isSpotifyPlaying,
  });

  return (
    <SpotifyPlaybackContext.Provider
      value={{
        playback: effectivePlayback,
        liveProgressMs,
        isSpotifyPlaying,
        nextTrackLyrics,
      }}
    >
      {children}
    </SpotifyPlaybackContext.Provider>
  );
}

export function SpotifyPlaybackProvider({
  playback,
  nextTrackLyrics = null,
  nextTrackPlayback = null,
  onTrackEndReached,
  children,
}: SpotifyPlaybackProviderProps) {
  return (
    <PlaybackClockBridge
      playback={playback}
      nextTrackLyrics={nextTrackLyrics}
      nextTrackPlayback={nextTrackPlayback}
      onTrackEndReached={onTrackEndReached}
    >
      {children}
    </PlaybackClockBridge>
  );
}

export function useSpotifyPlaybackContext(): SpotifyPlaybackContextValue {
  const value = useContext(SpotifyPlaybackContext);

  if (!value) {
    throw new Error(
      "useSpotifyPlaybackContext must be used within SpotifyPlaybackProvider",
    );
  }

  return value;
}
