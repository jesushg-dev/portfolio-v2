import type {
  NowPlayingResponse,
  PlayHistoryObject,
  QueueResponse,
  RecentlyPlayedResponse,
  SpotifyPlaybackContext as ApiPlaybackContext,
} from "@/utils/interfaces/spotify";
import type { Episode, Track } from "@/utils/interfaces/spotify/entities";
import { resolveSpotifyUrl } from "@/utils/services/spotify-scopes";

import type { SpotifyPlayback, SpotifyPlaybackContext } from "./types";
import type { TrackLyricsRequest } from "./track-lyrics-types";

export function isTrack(item: Track | Episode): item is Track {
  return item.type === "track";
}

export function isEpisode(item: Track | Episode): item is Episode {
  return item.type === "episode";
}

function mapPlaybackContext(
  context: ApiPlaybackContext | PlayHistoryObject["context"],
): SpotifyPlaybackContext | undefined {
  if (!context) return undefined;

  return {
    type: context.type,
    url: resolveSpotifyUrl(context.external_urls.spotify),
  };
}

function resolveDisplayArtists(item: Track): string[] {
  const trackArtists = item.artists.map((artist) => artist.name);
  const albumArtists = item.album.artists?.map((artist) => artist.name) ?? [];

  if (albumArtists.length > trackArtists.length) {
    return albumArtists;
  }

  return trackArtists;
}

function formatArtists(artists: string[]): string {
  if (artists.length > 2) {
    return `${artists.slice(0, -1).join(", ")} & ${artists[artists.length - 1]}`;
  }

  if (artists.length === 2) {
    return `${artists[0]} feat ${artists[1]}`;
  }

  return artists[0] ?? "";
}

export function mapTrackNowPlaying(
  track: Track,
  data: NowPlayingResponse,
): SpotifyPlayback {
  const artists = resolveDisplayArtists(track);

  return {
    contentId: track.id,
    snapshotTimestamp: data.timestamp,
    contentType: "track",
    source: "now_playing",
    title: track.name,
    subtitle: formatArtists(artists),
    subtitleUrl: resolveSpotifyUrl(
      track.artists[0]?.external_urls.spotify,
      track.external_urls.spotify,
    ),
    primaryArtist: track.artists[0]?.name ?? artists[0] ?? "",
    albumName: track.album.name,
    durationMs: track.duration_ms,
    progressMs: data.progress_ms ?? 0,
    isPlaying: data.is_playing,
    contentUrl: resolveSpotifyUrl(track.external_urls.spotify),
    imageUrl: track.album.images[0]?.url,
    imageAlt: track.album.name,
    previewUrl: track.preview_url,
    context: mapPlaybackContext(data.context),
    deviceType: data.device?.type,
  };
}

export function mapEpisodeNowPlaying(
  episode: Episode,
  data: NowPlayingResponse,
): SpotifyPlayback {
  return {
    contentId: episode.id,
    snapshotTimestamp: data.timestamp,
    contentType: "episode",
    source: "now_playing",
    title: episode.name,
    subtitle: episode.show.name,
    subtitleUrl: resolveSpotifyUrl(episode.show.external_urls.spotify),
    primaryArtist: episode.show.name,
    albumName: episode.show.name,
    durationMs: episode.duration_ms,
    progressMs:
      data.progress_ms ?? episode.resume_point?.resume_position_ms ?? 0,
    isPlaying: data.is_playing,
    contentUrl: resolveSpotifyUrl(episode.external_urls.spotify),
    imageUrl: episode.images[0]?.url ?? episode.show.images[0]?.url,
    imageAlt: episode.show.name,
    previewUrl: episode.audio_preview_url,
    context: mapPlaybackContext(data.context),
    deviceType: data.device?.type,
  };
}

export function mapRecentlyPlayed(
  data: RecentlyPlayedResponse,
): SpotifyPlayback | null {
  const history = data.items[0];
  if (!history || history.track.explicit) return null;

  const artists = resolveDisplayArtists(history.track);

  return {
    contentId: history.track.id,
    snapshotTimestamp: history.played_at ? Date.parse(history.played_at) : 0,
    contentType: "track",
    source: "recently_played",
    title: history.track.name,
    subtitle: formatArtists(artists),
    subtitleUrl: resolveSpotifyUrl(
      history.track.artists[0]?.external_urls.spotify,
      history.track.external_urls.spotify,
    ),
    primaryArtist: history.track.artists[0]?.name ?? artists[0] ?? "",
    albumName: history.track.album.name,
    durationMs: history.track.duration_ms,
    progressMs: 0,
    isPlaying: false,
    contentUrl: resolveSpotifyUrl(history.track.external_urls.spotify),
    imageUrl: history.track.album.images[0]?.url,
    imageAlt: history.track.album.name,
    previewUrl: history.track.preview_url,
    playedAt: history.played_at,
    context: mapPlaybackContext(history.context),
  };
}

export function resolveTrackFromQueue(queue: QueueResponse): Track | null {
  const { currently_playing: currentlyPlaying } = queue;

  if (currentlyPlaying && isTrack(currentlyPlaying)) {
    return currentlyPlaying;
  }

  const queuedTrack = queue.queue.find(isTrack);
  return queuedTrack ?? null;
}

export function resolveEpisodeFromQueue(queue: QueueResponse): Episode | null {
  const { currently_playing: currentlyPlaying } = queue;

  if (currentlyPlaying && isEpisode(currentlyPlaying)) {
    return currentlyPlaying;
  }

  const queuedEpisode = queue.queue.find(isEpisode);
  return queuedEpisode ?? null;
}

export function isActiveTrackPlayback(data: NowPlayingResponse): boolean {
  return data.currently_playing_type === "track" && data.is_playing;
}

export function isActiveEpisodePlayback(data: NowPlayingResponse): boolean {
  return data.currently_playing_type === "episode" && data.is_playing;
}

export function isExplicitActivePlayback(data: NowPlayingResponse): boolean {
  if (!data.is_playing) return false;

  if (data.currently_playing_type === "track") {
    return data.item !== null && isTrack(data.item) && data.item.explicit;
  }

  if (data.currently_playing_type === "episode") {
    return data.item !== null && isEpisode(data.item) && data.item.explicit;
  }

  return false;
}

export function needsQueueFallback(data: NowPlayingResponse): boolean {
  if (!data.is_playing) return false;

  if (data.currently_playing_type === "episode") {
    return data.item === null || !isEpisode(data.item);
  }

  if (data.currently_playing_type === "track") {
    return data.item === null || !isTrack(data.item);
  }

  return false;
}

export function resolveTrackFromNowPlaying(
  data: NowPlayingResponse,
): Track | null {
  if (data.item && isTrack(data.item) && !data.item.explicit) {
    return data.item;
  }

  return null;
}

export function resolveEpisodeFromNowPlaying(
  data: NowPlayingResponse,
): Episode | null {
  if (data.item && isEpisode(data.item) && !data.item.explicit) {
    return data.item;
  }

  return null;
}

export function trackToLyricsRequest(track: Track): TrackLyricsRequest {
  return {
    contentId: track.id,
    title: track.name,
    artist: track.artists[0]?.name ?? "",
    album: track.album.name,
    durationMs: track.duration_ms,
  };
}

/** First upcoming track in the queue after the currently playing item. */
export function resolveNextQueuedTrack(
  queue: QueueResponse,
  currentContentId: string,
): Track | null {
  for (const item of queue.queue) {
    if (isTrack(item) && item.id !== currentContentId && !item.explicit) {
      return item;
    }
  }

  return null;
}
