export interface TrackLyricsRequest {
  contentId: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
}

export interface TrackLyricsPayload {
  plainLyrics: string;
  syncedLyrics: string | null;
}

export type LyricsCacheEntry =
  | { status: "ready"; lyrics: TrackLyricsPayload }
  | { status: "empty"; cachedAt: number }
  | { status: "error"; cachedAt: number };

export type LyricsPrefetchMode = "background" | "active";
