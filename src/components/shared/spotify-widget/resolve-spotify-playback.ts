import type { NowPlayingResponse, QueueResponse, RecentlyPlayedResponse } from "@/utils/interfaces/spotify";

import {
  isActiveEpisodePlayback,
  isActiveTrackPlayback,
  isExplicitActivePlayback,
  mapEpisodeNowPlaying,
  mapRecentlyPlayed,
  mapTrackNowPlaying,
  resolveEpisodeFromNowPlaying,
  resolveEpisodeFromQueue,
  resolveTrackFromNowPlaying,
  resolveTrackFromQueue,
} from "./playback-mappers";
import type { SpotifyPlayback } from "./types";

type NowPlayingData = NowPlayingResponse | { error: { status: number } } | undefined;
type QueueData = QueueResponse | { error: { status: number } } | undefined;
type RecentlyPlayedData = RecentlyPlayedResponse | { error: { status: number } } | undefined;

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

    // If the active playback is explicit, we don't resolve anything directly,
    // but allow falling into the "recently played" fallback.
    if (isExplicitActivePlayback(data)) {
      shouldTryRecentlyPlayed = true;
    }
    // Track playback is active
    else if (isActiveTrackPlayback(data)) {
      const track =
        resolveTrackFromNowPlaying(data) ??
        (isValidQueue(queueData) ? resolveTrackFromQueue(queueData) : null);

      if (!track) return null;

      if (track.explicit) {
        shouldTryRecentlyPlayed = true;
      } else {
        return mapTrackNowPlaying(track, data);
      }
    }
    // Episode playback is active
    else if (isActiveEpisodePlayback(data)) {
      const episode =
        resolveEpisodeFromNowPlaying(data) ??
        (isValidQueue(queueData) ? resolveEpisodeFromQueue(queueData) : null);

      if (!episode) return null;

      if (episode.explicit) {
        shouldTryRecentlyPlayed = true;
      } else {
        return mapEpisodeNowPlaying(episode, data);
      }
    }
  }
  // If it's a different error than 204, we don't do anything
  else if (nowPlayingData.error.status !== 204) {
    return null;
  }

  // Si no debemos o no podemos usar la lista de recientes, terminamos
  if (!shouldTryRecentlyPlayed) return null;

  // Fallback with the last song/episode played
  if (!recentlyPlayedData || "error" in recentlyPlayedData) return null;

  return mapRecentlyPlayed(recentlyPlayedData);
}