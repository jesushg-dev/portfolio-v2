import type { NowPlayingResponse } from "@/utils/interfaces/spotify";
import type { QueueResponse } from "@/utils/interfaces/spotify";
import type { RecentlyPlayedResponse } from "@/utils/interfaces/spotify";

import {
  isActiveEpisodePlayback,
  isActiveTrackPlayback,
  mapEpisodeNowPlaying,
  mapRecentlyPlayed,
  mapTrackNowPlaying,
  resolveEpisodeFromNowPlaying,
  resolveEpisodeFromQueue,
  resolveTrackFromNowPlaying,
  resolveTrackFromQueue,
} from "./playback-mappers";
import type { SpotifyPlayback } from "./types";

type NowPlayingData =
  NowPlayingResponse | { error: { status: number } } | undefined;

type QueueData = QueueResponse | { error: { status: number } } | undefined;

type RecentlyPlayedData =
  RecentlyPlayedResponse | { error: { status: number } } | undefined;

export function resolveSpotifyPlayback(
  nowPlayingData: NowPlayingData,
  queueData: QueueData,
  recentlyPlayedData: RecentlyPlayedData,
  shouldUseRecentlyPlayed: boolean,
): SpotifyPlayback | null {
  if (!nowPlayingData) return null;

  if (!("error" in nowPlayingData)) {
    const data = nowPlayingData;

    if (isActiveTrackPlayback(data)) {
      const track =
        resolveTrackFromNowPlaying(data) ??
        (queueData && !("error" in queueData)
          ? resolveTrackFromQueue(queueData)
          : null);

      if (track && !track.explicit) {
        return mapTrackNowPlaying(track, data);
      }

      return null;
    }

    if (isActiveEpisodePlayback(data)) {
      const episode =
        resolveEpisodeFromNowPlaying(data) ??
        (queueData && !("error" in queueData)
          ? resolveEpisodeFromQueue(queueData)
          : null);

      if (episode && !episode.explicit) {
        return mapEpisodeNowPlaying(episode, data);
      }

      return null;
    }
  } else if (nowPlayingData.error.status !== 204) {
    return null;
  }

  if (!shouldUseRecentlyPlayed) return null;

  if (!recentlyPlayedData || "error" in recentlyPlayedData) {
    return null;
  }

  return mapRecentlyPlayed(recentlyPlayedData);
}
