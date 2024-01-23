import type { Track } from "./entities";
import type { SpotifyEntity } from "./entity.d";

export interface PlayHistoryObject {
  track: Track;
  played_at?: string;
  context?: unknown | null;
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

export interface ErrorResponse {
  error: {
    status: number;
    message: string;
  };
}

export interface NowPlayingResponse {
  item: Track;
  is_playing: boolean;
  progress_ms: number;
  timestamp: number;
  currently_playing_type: "track" | "episode" | "ad" | "unknown";
}
