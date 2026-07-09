"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SpotifyPlayback } from "./types";
import { usePlaybackClock } from "./use-playback-clock";

export interface SpotifyPlaybackContextValue {
  playback: SpotifyPlayback;
  liveProgressMs: number;
  isSpotifyPlaying: boolean;
}

const SpotifyPlaybackContext =
  createContext<SpotifyPlaybackContextValue | null>(null);

interface SpotifyPlaybackProviderProps {
  playback: SpotifyPlayback;
  children: ReactNode;
}

function PlaybackClockBridge({
  playback,
  children,
}: SpotifyPlaybackProviderProps) {
  const isSpotifyPlaying =
    playback.source === "now_playing" && playback.isPlaying;

  const liveProgressMs = usePlaybackClock(
    playback.progressMs,
    playback.durationMs,
    isSpotifyPlaying,
  );

  return (
    <SpotifyPlaybackContext.Provider
      value={{ playback, liveProgressMs, isSpotifyPlaying }}
    >
      {children}
    </SpotifyPlaybackContext.Provider>
  );
}

export function SpotifyPlaybackProvider({
  playback,
  children,
}: SpotifyPlaybackProviderProps) {
  return (
    <PlaybackClockBridge key={playback.contentId} playback={playback}>
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
