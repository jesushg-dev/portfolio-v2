"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/trpc/react";
import { ETime } from "@/utils/constants/times";
import type {
  NowPlayingResponse,
  QueueResponse,
} from "@/utils/interfaces/spotify";
import { getSpotifyQueryError } from "@/utils/services/spotify-scopes";

import {
  isActiveEpisodePlayback,
  isActiveTrackPlayback,
  isExplicitActivePlayback,
  isTrackNearEnd,
  mapQueuedTrackPlayback,
  needsQueueFallback,
  resolveNextQueuedTrack,
  trackToLyricsRequest,
} from "../utils/playback-mappers";
import { resolveSpotifyPlayback } from "../utils/resolve-spotify-playback";
import { SPOTIFY_NEAR_END_MS } from "../utils/spotify-timing";
import type { SpotifyPlayback, SpotifyPlaybackError } from "../types/types";
import type { TrackLyricsRequest } from "../types/track-lyrics-types";

const FAST_POLL_MS = 5 * ETime.SECOND;
const MEDIUM_POLL_MS = 10 * ETime.SECOND;
const IDLE_POLL_MS = 15 * ETime.SECOND;

function isValidNowPlaying(data: NowPlayingResponse): boolean {
  return isActiveTrackPlayback(data) || isActiveEpisodePlayback(data);
}

function isNowPlayingIdleResponse(
  data: NowPlayingResponse | { error: { status: number } } | undefined,
): boolean {
  return data !== undefined && "error" in data && data.error.status === 204;
}

function isTransientSpotifyError(error: SpotifyPlaybackError): boolean {
  return error.status === 502;
}

function getNowPlayingPollInterval(
  data: NowPlayingResponse | { error: { status: number } } | undefined,
): number {
  if (!data || "error" in data) return IDLE_POLL_MS;

  if (!("error" in data) && isTrackNearEnd(data, SPOTIFY_NEAR_END_MS)) {
    return FAST_POLL_MS;
  }

  if (!isValidNowPlaying(data)) return IDLE_POLL_MS;
  if (!data.is_playing) return MEDIUM_POLL_MS;

  const durationMs =
    data.item && "duration_ms" in data.item ? data.item.duration_ms : null;

  if (durationMs === null) return MEDIUM_POLL_MS;

  return ETime.HALF_MINUTE;
}

function isNearEndOfTrack(data: NowPlayingResponse): boolean {
  return isTrackNearEnd(data, SPOTIFY_NEAR_END_MS);
}

function resolveNextTrackLyrics(
  queueData: QueueResponse | { error: { status: number } } | undefined,
  currentContentId: string,
): TrackLyricsRequest | null {
  if (!queueData || "error" in queueData) return null;

  const nextTrack = resolveNextQueuedTrack(queueData, currentContentId);
  return nextTrack ? trackToLyricsRequest(nextTrack) : null;
}

function resolveNextTrackPlayback(
  playback: SpotifyPlayback,
  queueData: QueueResponse | { error: { status: number } } | undefined,
): SpotifyPlayback | null {
  if (playback.contentType !== "track" || playback.source !== "now_playing") {
    return null;
  }

  if (!queueData || "error" in queueData) return null;

  const nextTrack = resolveNextQueuedTrack(queueData, playback.contentId);
  return nextTrack ? mapQueuedTrackPlayback(nextTrack, playback) : null;
}

export function useSpotifyPlayback() {
  const utils = api.useUtils();
  const wasActivelyPlayingRef = useRef(false);
  const [lastPlayback, setLastPlayback] = useState<SpotifyPlayback | null>(
    null,
  );
  const [lastStoredContentId, setLastStoredContentId] = useState<string | null>(
    null,
  );

  const nowPlayingQuery = api.spotify.getNowPlaying.useQuery(undefined, {
    staleTime: ETime.HALF_SECOND,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => getNowPlayingPollInterval(query.state.data),
  });

  const needsQueue =
    nowPlayingQuery.data !== undefined &&
    !("error" in nowPlayingQuery.data) &&
    needsQueueFallback(nowPlayingQuery.data);

  const isActiveTrack =
    nowPlayingQuery.data !== undefined &&
    !("error" in nowPlayingQuery.data) &&
    isActiveTrackPlayback(nowPlayingQuery.data);

  const nearEnd =
    nowPlayingQuery.data !== undefined &&
    !("error" in nowPlayingQuery.data) &&
    isNearEndOfTrack(nowPlayingQuery.data);

  const shouldFetchQueue =
    (needsQueue || isActiveTrack) && !nowPlayingQuery.isLoading;

  const queueQuery = api.spotify.getQueue.useQuery(undefined, {
    enabled: shouldFetchQueue,
    staleTime: ETime.HALF_SECOND,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchInterval: () => {
      if (needsQueue) return ETime.HALF_MINUTE;
      if (nearEnd) return FAST_POLL_MS;
      if (isActiveTrack) return ETime.HALF_MINUTE;
      return false;
    },
  });

  const isNowPlayingIdle = isNowPlayingIdleResponse(nowPlayingQuery.data);

  const isExplicitNowPlaying =
    nowPlayingQuery.data !== undefined &&
    !("error" in nowPlayingQuery.data) &&
    isExplicitActivePlayback(nowPlayingQuery.data);

  const shouldUseRecentlyPlayed =
    nowPlayingQuery.data !== undefined &&
    !nowPlayingQuery.isLoading &&
    !nowPlayingQuery.isFetching &&
    (isNowPlayingIdle ||
      isExplicitNowPlaying ||
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

  const handleTrackEndReached = useCallback(() => {
    void utils.spotify.getNowPlaying.invalidate();
    void utils.spotify.getQueue.invalidate();
  }, [utils]);

  const recentlyPlayedQuery = api.spotify.getRecentlyPlayed.useQuery(
    undefined,
    {
      enabled: shouldUseRecentlyPlayed,
      staleTime: ETime.HALF_MINUTE,
      refetchOnWindowFocus: true,
      placeholderData: keepPreviousData,
      refetchInterval: shouldUseRecentlyPlayed ? ETime.HALF_MINUTE : false,
    },
  );

  const playback = resolveSpotifyPlayback(
    nowPlayingQuery.data,
    queueQuery.data,
    recentlyPlayedQuery.data,
    shouldUseRecentlyPlayed,
  );

  const playbackContentId = playback?.contentId ?? null;
  if (playback && playbackContentId !== lastStoredContentId) {
    setLastStoredContentId(playbackContentId);
    setLastPlayback(playback);
  }

  const hasTransientFailure =
    nowPlayingQuery.data !== undefined &&
    "error" in nowPlayingQuery.data &&
    nowPlayingQuery.data.error.status === 502;

  const displayPlayback =
    playback ??
    (nowPlayingQuery.isFetching || hasTransientFailure || isExplicitNowPlaying
      ? lastPlayback
      : null);

  const nextTrackLyrics =
    displayPlayback?.contentType === "track"
      ? resolveNextTrackLyrics(queueQuery.data, displayPlayback.contentId)
      : null;

  const nextTrackPlayback =
    displayPlayback?.contentType === "track"
      ? resolveNextTrackPlayback(displayPlayback, queueQuery.data)
      : null;

  const error = ((): SpotifyPlaybackError | null => {
    if (!nowPlayingQuery.data) return null;

    if ("error" in nowPlayingQuery.data) {
      if (nowPlayingQuery.data.error.status === 204) {
        return getSpotifyQueryError(recentlyPlayedQuery.data);
      }

      const nowPlayingError = getSpotifyQueryError(nowPlayingQuery.data);
      if (
        nowPlayingError &&
        isTransientSpotifyError(nowPlayingError) &&
        lastPlayback
      ) {
        return null;
      }

      return nowPlayingError;
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
      !recentlyPlayedQuery.data &&
      !lastPlayback);

  return {
    playback: displayPlayback,
    nextTrackLyrics,
    nextTrackPlayback,
    onTrackEndReached: handleTrackEndReached,
    error,
    isLoading,
    isFetchError:
      nowPlayingQuery.data === undefined && !nowPlayingQuery.isLoading,
  };
}
