import type {
  SpotifyContextType,
  SpotifyDeviceType,
} from "@/utils/interfaces/spotify/request";

export type SpotifyPlaybackSource = "now_playing" | "recently_played";
export type SpotifyContentType = "track" | "episode";

export interface SpotifyPlaybackContext {
  type: SpotifyContextType;
  url: string;
}

export interface SpotifyPlayback {
  contentType: SpotifyContentType;
  source: SpotifyPlaybackSource;
  title: string;
  subtitle: string;
  subtitleUrl: string;
  primaryArtist: string;
  albumName: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
  contentUrl: string;
  imageUrl?: string;
  imageAlt: string;
  previewUrl?: string | null;
  playedAt?: string;
  context?: SpotifyPlaybackContext;
  deviceType?: SpotifyDeviceType;
}

/** @deprecated Use SpotifyPlayback */
export type SpotifyPlaybackTrack = SpotifyPlayback;

export interface SpotifyPlaybackError {
  status: number;
  message: string;
}
