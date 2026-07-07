import type { Episode, Track } from "./entities";
import type { SpotifyEntity } from "./entity";

export interface PlayHistoryObject {
  track: Track;
  played_at?: string;
  context?: SpotifyPlaybackContext | null;
}

export interface SpotifyResponse<T extends SpotifyEntity | PlayHistoryObject> {
  href: string;
  next?: string | null;
  previous?: string | null;
  limit: number;
  offset: number;
  total: number;
  items: Array<T>;
}

export interface RecentlyPlayedCursors {
  after: string;
  before: string;
}

/** GET /v1/me/player/recently-played — 200 response body. */
export interface RecentlyPlayedResponse {
  href: string;
  limit: number;
  next: string | null;
  cursors: RecentlyPlayedCursors;
  items: Array<PlayHistoryObject>;
}

export interface ErrorResponse {
  error: {
    status: number;
    message: string;
  };
}

export type SpotifyDeviceType =
  | "computer"
  | "tablet"
  | "smartphone"
  | "speaker"
  | "tv"
  | "avr"
  | "stereo"
  | "cast"
  | "automobile"
  | "unknown";

export type SpotifyRepeatState = "off" | "track" | "context";

export interface SpotifyDevice {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: SpotifyDeviceType;
  volume_percent: number | null;
  supports_volume?: boolean;
  repeat_state?: SpotifyRepeatState;
  shuffle_state?: boolean;
}

/** Context object for the currently playing item. Can be null. */
export type SpotifyContextType = "album" | "artist" | "playlist" | "show";

export interface SpotifyPlaybackContext {
  type: SpotifyContextType;
  href: string;
  external_urls: { spotify: string };
  uri: string;
}

export interface NowPlayingActionDisallows {
  interrupting_playback?: boolean;
  pausing?: boolean;
  resuming?: boolean;
  seeking?: boolean;
  skipping_next?: boolean;
  skipping_prev?: boolean;
  toggling_repeat_context?: boolean;
  toggling_shuffle?: boolean;
  toggling_repeat_track?: boolean;
  transferring_playback?: boolean;
}

/** Playback actions available in the current context. */
export interface NowPlayingActions {
  interrupting_playback?: boolean;
  pausing?: boolean;
  resuming?: boolean;
  seeking?: boolean;
  skipping_next?: boolean;
  skipping_prev?: boolean;
  toggling_repeat_context?: boolean;
  toggling_shuffle?: boolean;
  toggling_repeat_track?: boolean;
  transferring_playback?: boolean;
  /** Present in some API responses as inverted capability flags. */
  disallows?: NowPlayingActionDisallows;
}

export type CurrentlyPlayingType = "track" | "episode" | "ad" | "unknown";

/** GET /v1/me/player/currently-playing — 200 response body. */
export interface NowPlayingResponse {
  device?: SpotifyDevice;
  repeat_state?: SpotifyRepeatState;
  shuffle_state?: boolean;
  context?: SpotifyPlaybackContext | null;
  timestamp: number;
  progress_ms: number | null;
  is_playing: boolean;
  item: Track | Episode | null;
  currently_playing_type: CurrentlyPlayingType;
  actions?: NowPlayingActions;
}

/** GET /v1/me/player/queue — 200 response body. */
export interface QueueResponse {
  currently_playing: Track | Episode | null;
  queue: Array<Track | Episode>;
}
