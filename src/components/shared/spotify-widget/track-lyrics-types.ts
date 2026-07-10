export interface TrackLyricsRequest {
  contentId: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
}

export type TrackLyricsPayload = {
  plainLyrics: string;
  syncedLyrics: string | null;
};

export type LyricsCacheEntry =
  | { status: "ready"; lyrics: TrackLyricsPayload }
  | { status: "empty" }
  | { status: "error" };
