"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

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
  children: ReactNode;
}

function PlaybackClockBridge({
  playback,
  nextTrackLyrics = null,
  children,
}: SpotifyPlaybackProviderProps) {
  const isSpotifyPlaying =
    playback.source === "now_playing" && playback.isPlaying;

  const liveProgressMs = usePlaybackClock(
    playback.contentId,
    playback.progressMs,
    playback.durationMs,
    isSpotifyPlaying,
  );

  useEffect(() => {
    if (playback.contentType !== "track") return;

    void prefetchTrackLyrics({
      contentId: playback.contentId,
      title: playback.title,
      artist: playback.primaryArtist,
      album: playback.albumName,
      durationMs: playback.durationMs,
    });
  }, [
    playback.contentId,
    playback.contentType,
    playback.title,
    playback.primaryArtist,
    playback.albumName,
    playback.durationMs,
  ]);

  usePrefetchNextLyrics({
    currentContentId: playback.contentId,
    nextTrack: nextTrackLyrics,
    liveProgressMs,
    durationMs: playback.durationMs,
    isPlaying: isSpotifyPlaying,
  });

  return (
    <SpotifyPlaybackContext.Provider
      value={{
        playback,
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
  children,
}: SpotifyPlaybackProviderProps) {
  return (
    <PlaybackClockBridge playback={playback} nextTrackLyrics={nextTrackLyrics}>
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
