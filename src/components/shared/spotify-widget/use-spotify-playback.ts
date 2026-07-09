"use client";

import { useEffect, useRef } from "react";

import { api } from "@/trpc/react";
import { ETime } from "@/utils/constants/times";
import type { NowPlayingResponse } from "@/utils/interfaces/spotify";
import { getSpotifyQueryError } from "@/utils/services/spotify-scopes";

import {
  isActiveEpisodePlayback,
  isActiveTrackPlayback,
  needsQueueFallback,
} from "./playback-mappers";
import { resolveSpotifyPlayback } from "./resolve-spotify-playback";
import type { SpotifyPlaybackError } from "./types";

const NEAR_END_MS = 45 * ETime.SECOND;
const FAST_POLL_MS = 5 * ETime.SECOND;
const MEDIUM_POLL_MS = 10 * ETime.SECOND;
const IDLE_POLL_MS = 15 * ETime.SECOND;

function isValidNowPlaying(data: NowPlayingResponse): boolean {
  return isActiveTrackPlayback(data) || isActiveEpisodePlayback(data);
}

function getNowPlayingPollInterval(
  data: NowPlayingResponse | { error: { status: number } } | undefined,
): number {
  if (!data || "error" in data) return IDLE_POLL_MS;
  if (!isValidNowPlaying(data)) return IDLE_POLL_MS;
  if (!data.is_playing) return MEDIUM_POLL_MS;

  const durationMs =
    data.item && "duration_ms" in data.item ? data.item.duration_ms : null;

  if (durationMs === null) return MEDIUM_POLL_MS;

  const remaining = durationMs - (data.progress_ms ?? 0);
  if (remaining <= NEAR_END_MS) return FAST_POLL_MS;

  return ETime.HALF_MINUTE;
}

export function useSpotifyPlayback() {
  const utils = api.useUtils();
  const wasActivelyPlayingRef = useRef(false);

  const nowPlayingQuery = api.spotify.getNowPlaying.useQuery(undefined, {
    staleTime: ETime.HALF_SECOND,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => getNowPlayingPollInterval(query.state.data),
  });

  const needsQueue =
    nowPlayingQuery.data !== undefined &&
    !("error" in nowPlayingQuery.data) &&
    needsQueueFallback(nowPlayingQuery.data);

  const queueQuery = api.spotify.getQueue.useQuery(undefined, {
    enabled: needsQueue && !nowPlayingQuery.isLoading,
    staleTime: ETime.HALF_SECOND,
    refetchOnWindowFocus: true,
    refetchInterval: needsQueue ? ETime.HALF_MINUTE : false,
  });

  const isIdle =
    nowPlayingQuery.data !== undefined &&
    "error" in nowPlayingQuery.data &&
    nowPlayingQuery.data.error.status === 204;

  const shouldUseRecentlyPlayed =
    nowPlayingQuery.data !== undefined &&
    (isIdle ||
      (!("error" in nowPlayingQuery.data) &&
        !isValidNowPlaying(nowPlayingQuery.data)));

  const isActivelyPlaying =
    nowPlayingQuery.data !== undefined &&
    !("error" in nowPlayingQuery.data) &&
    isValidNowPlaying(nowPlayingQuery.data) &&
    nowPlayingQuery.data.is_playing;

  useEffect(() => {
    if (wasActivelyPlayingRef.current && !isActivelyPlaying) {
      void utils.spotify.getNowPlaying.invalidate();
      void utils.spotify.getQueue.invalidate();
      void utils.spotify.getRecentlyPlayed.invalidate();
    }

    wasActivelyPlayingRef.current = isActivelyPlaying;
  }, [isActivelyPlaying, utils]);

  const recentlyPlayedQuery = api.spotify.getRecentlyPlayed.useQuery(
    undefined,
    {
      enabled: !nowPlayingQuery.isLoading,
      staleTime: ETime.HALF_SECOND,
      refetchOnWindowFocus: true,
      refetchInterval: shouldUseRecentlyPlayed ? ETime.HALF_MINUTE : false,
    },
  );

  const playback = resolveSpotifyPlayback(
    nowPlayingQuery.data,
    queueQuery.data,
    recentlyPlayedQuery.data,
    shouldUseRecentlyPlayed,
  );

  const error = ((): SpotifyPlaybackError | null => {
    if (!nowPlayingQuery.data) return null;

    if ("error" in nowPlayingQuery.data) {
      if (nowPlayingQuery.data.error.status === 204) {
        return getSpotifyQueryError(recentlyPlayedQuery.data);
      }

      return getSpotifyQueryError(nowPlayingQuery.data);
    }

    if (shouldUseRecentlyPlayed && !playback) {
      return getSpotifyQueryError(recentlyPlayedQuery.data);
    }

    return null;
  })();

  const isLoading =
    nowPlayingQuery.isLoading ||
    (needsQueue && queueQuery.isLoading && !queueQuery.data) ||
    (shouldUseRecentlyPlayed &&
      recentlyPlayedQuery.isLoading &&
      !recentlyPlayedQuery.data);

  return {
    playback,
    error,
    isLoading,
    isFetchError:
      nowPlayingQuery.data === undefined && !nowPlayingQuery.isLoading,
  };
}
