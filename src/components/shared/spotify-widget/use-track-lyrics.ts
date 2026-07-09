"use client";

import { useEffect, useState } from "react";

export type TrackLyrics = {
  plainLyrics: string;
  syncedLyrics: string | null;
};

type LyricsStatus = "idle" | "loading" | "ready" | "empty" | "error";

export type UseTrackLyricsResult = {
  status: LyricsStatus;
  lyrics: TrackLyrics | null;
};

type LyricsQuery = {
  enabled: boolean;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
};

type CacheEntry =
  | { status: "ready"; lyrics: TrackLyrics }
  | { status: "empty" }
  | { status: "error" };

const lyricsCache = new Map<string, CacheEntry>();

function cacheKey(
  title: string,
  artist: string,
  album: string,
  durationMs: number,
): string {
  return `${artist.toLowerCase()}|${title.toLowerCase()}|${album.toLowerCase()}|${Math.round(durationMs / 1000)}`;
}

function resultFromCache(entry: CacheEntry): UseTrackLyricsResult {
  if (entry.status === "ready") {
    return { status: "ready", lyrics: entry.lyrics };
  }
  return { status: entry.status, lyrics: null };
}

export function useTrackLyrics({
  enabled,
  title,
  artist,
  album,
  durationMs,
}: LyricsQuery): UseTrackLyricsResult {
  const key =
    enabled && title && artist
      ? cacheKey(title, artist, album, durationMs)
      : null;

  // Bumped only from async fetch callbacks to re-read the cache.
  const [cacheVersion, setCacheVersion] = useState(0);

  useEffect(() => {
    if (!key) return;
    if (lyricsCache.has(key)) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      artist,
      title,
      album,
      duration: String(Math.round(durationMs / 1000)),
    });

    void (async () => {
      try {
        const res = await fetch(`/api/lyrics?${params.toString()}`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (res.status === 404) {
          lyricsCache.set(key, { status: "empty" });
          setCacheVersion((v) => v + 1);
          return;
        }

        if (!res.ok) {
          lyricsCache.set(key, { status: "error" });
          setCacheVersion((v) => v + 1);
          return;
        }

        const data = (await res.json()) as {
          plainLyrics?: string;
          syncedLyrics?: string | null;
        };

        if (!data.plainLyrics?.trim()) {
          lyricsCache.set(key, { status: "empty" });
          setCacheVersion((v) => v + 1);
          return;
        }

        lyricsCache.set(key, {
          status: "ready",
          lyrics: {
            plainLyrics: data.plainLyrics,
            syncedLyrics: data.syncedLyrics ?? null,
          },
        });
        setCacheVersion((v) => v + 1);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        lyricsCache.set(key, { status: "error" });
        setCacheVersion((v) => v + 1);
      }
    })();

    return () => controller.abort();
  }, [key, title, artist, album, durationMs]);

  void cacheVersion;

  if (!key) {
    return { status: "idle", lyrics: null };
  }

  const cached = lyricsCache.get(key);
  if (cached) {
    return resultFromCache(cached);
  }

  return { status: "loading", lyrics: null };
}

export function previewLyricsLines(
  plainLyrics: string,
  maxLines = 3,
): string[] {
  return plainLyrics
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);
}

/** Test helper — clears in-memory lyrics cache. */
export function clearLyricsCacheForTests(): void {
  lyricsCache.clear();
}
