import type {
  NowPlayingResponse,
  QueueResponse,
  RecentlyPlayedResponse,
} from "@/utils/interfaces/spotify";

import {
  isEpisode,
  isExplicitActivePlayback,
  isTrack,
  mapEpisodeNowPlaying,
  mapRecentlyPlayed,
  mapTrackNowPlaying,
  resolveEpisodeFromNowPlaying,
  resolveEpisodeFromQueue,
  resolveTrackFromNowPlaying,
  resolveTrackFromQueue,
} from "./playback-mappers";
import type { SpotifyPlayback } from "../types/types";

type NowPlayingData =
  NowPlayingResponse | { error: { status: number } } | undefined;
type QueueData = QueueResponse | { error: { status: number } } | undefined;
type RecentlyPlayedData =
  RecentlyPlayedResponse | { error: { status: number } } | undefined;

// Helper to verify if the queue data is valid (exists and is not an error)
function isValidQueue(data: QueueData): data is QueueResponse {
  return data != null && !("error" in data);
}

export function resolveSpotifyPlayback(
  nowPlayingData: NowPlayingData,
  queueData: QueueData,
  recentlyPlayedData: RecentlyPlayedData,
  shouldUseRecentlyPlayed: boolean,
): SpotifyPlayback | null {
  if (!nowPlayingData) return null;

  let shouldTryRecentlyPlayed = shouldUseRecentlyPlayed;

  if (!("error" in nowPlayingData)) {
    const data = nowPlayingData;

    // If the playback item is explicit, don't resolve it directly,
    // but fall back to recently played history.
    if (isExplicitActivePlayback(data)) {
      shouldTryRecentlyPlayed = true;
    }
    // Track playback (active or paused)
    else if (
      data.currently_playing_type === "track" ||
      (data.item && isTrack(data.item))
    ) {
      const track =
        resolveTrackFromNowPlaying(data) ??
        (isValidQueue(queueData) ? resolveTrackFromQueue(queueData) : null);

      if (track) {
        if (track.explicit) {
          shouldTryRecentlyPlayed = true;
        } else {
          return mapTrackNowPlaying(track, data);
        }
      } else {
        shouldTryRecentlyPlayed = true;
      }
    }
    // Episode playback (active or paused)
    else if (
      data.currently_playing_type === "episode" ||
      (data.item && isEpisode(data.item))
    ) {
      const episode =
        resolveEpisodeFromNowPlaying(data) ??
        (isValidQueue(queueData) ? resolveEpisodeFromQueue(queueData) : null);

      if (episode) {
        if (episode.explicit) {
          shouldTryRecentlyPlayed = true;
        } else {
          return mapEpisodeNowPlaying(episode, data);
        }
      } else {
        shouldTryRecentlyPlayed = true;
      }
    } else {
      shouldTryRecentlyPlayed = true;
    }
  }
  // 204 No Content means player is idle; enable recently played fallback
  else if (nowPlayingData.error.status === 204) {
    shouldTryRecentlyPlayed = true;
  } else {
    return null;
  }

  // Fallback with recently played tracks
  if (!shouldTryRecentlyPlayed) return null;

  if (!recentlyPlayedData || "error" in recentlyPlayedData) return null;

  return mapRecentlyPlayed(recentlyPlayedData);
}
