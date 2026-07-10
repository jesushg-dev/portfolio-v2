"use client";

import { useEffect, useSyncExternalStore } from "react";

import type {
  LyricsCacheEntry,
  TrackLyricsPayload,
  TrackLyricsRequest,
} from "./track-lyrics-types";

type LyricsStatus = "idle" | "loading" | "ready" | "empty" | "error";

export type TrackLyrics = TrackLyricsPayload;

export type UseTrackLyricsResult = {
  status: LyricsStatus;
  lyrics: TrackLyrics | null;
};

type LyricsQuery = TrackLyricsRequest & {
  enabled: boolean;
};

const SESSION_STORAGE_KEY = "spotify-lyrics-cache-v2";
const MAX_SESSION_ENTRIES = 40;

const lyricsCache = new Map<string, LyricsCacheEntry>();
const inflight = new Map<string, Promise<void>>();
const cacheListeners = new Set<() => void>();

let sessionHydrated = false;
let cacheVersion = 0;

function notifyCacheListeners(): void {
  cacheVersion += 1;
  for (const listener of cacheListeners) {
    listener();
  }
}

function subscribeToLyricsCache(listener: () => void): () => void {
  cacheListeners.add(listener);
  return () => {
    cacheListeners.delete(listener);
  };
}

function getLyricsCacheVersion(): number {
  return cacheVersion;
}

function buildLyricsCacheKey(request: TrackLyricsRequest): string {
  if (request.contentId) {
    return `spotify:${request.contentId}`;
  }

  return `${request.artist.toLowerCase()}|${request.title.toLowerCase()}|${request.album.toLowerCase()}|${Math.round(request.durationMs / 1000)}`;
}

function resultFromCache(entry: LyricsCacheEntry): UseTrackLyricsResult {
  if (entry.status === "ready") {
    return { status: "ready", lyrics: entry.lyrics };
  }

  return { status: entry.status, lyrics: null };
}

function hydrateSessionCache(): void {
  if (sessionHydrated || typeof window === "undefined") return;
  sessionHydrated = true;

  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Record<string, LyricsCacheEntry>;
    for (const [key, entry] of Object.entries(parsed)) {
      if (!lyricsCache.has(key)) {
        lyricsCache.set(key, entry);
      }
    }
  } catch {
    // Ignore corrupt session cache.
  }
}

function persistSessionCache(): void {
  if (typeof window === "undefined") return;

  const entries = [...lyricsCache.entries()]
    .filter(([, entry]) => entry.status === "ready" || entry.status === "empty")
    .slice(-MAX_SESSION_ENTRIES);

  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(entries)),
    );
  } catch {
    // Storage full or unavailable.
  }
}

function setCacheEntry(key: string, entry: LyricsCacheEntry): void {
  lyricsCache.set(key, entry);
  persistSessionCache();
  notifyCacheListeners();
}

function shouldSkipPrefetch(key: string): boolean {
  const cached = lyricsCache.get(key);
  return cached?.status === "ready" || cached?.status === "empty";
}

function buildLyricsUrl(request: TrackLyricsRequest): string {
  const params = new URLSearchParams({
    artist: request.artist,
    title: request.title,
    album: request.album,
    duration: String(Math.round(request.durationMs / 1000)),
    spotifyId: request.contentId,
  });

  return `/api/lyrics?${params.toString()}`;
}

export async function prefetchTrackLyrics(
  request: TrackLyricsRequest,
): Promise<void> {
  hydrateSessionCache();

  if (!request.title || !request.artist) return Promise.resolve();

  const key = buildLyricsCacheKey(request);
  if (shouldSkipPrefetch(key)) return Promise.resolve();

  const pending = inflight.get(key);
  if (pending) return pending;

  const fetchPromise = (async () => {
    try {
      const res = await fetch(buildLyricsUrl(request));

      if (res.status === 404) {
        setCacheEntry(key, { status: "empty" });
        return;
      }

      if (!res.ok) {
        setCacheEntry(key, { status: "error" });
        return;
      }

      const data = (await res.json()) as {
        plainLyrics?: string;
        syncedLyrics?: string | null;
      };

      if (!data.plainLyrics?.trim()) {
        setCacheEntry(key, { status: "empty" });
        return;
      }

      setCacheEntry(key, {
        status: "ready",
        lyrics: {
          plainLyrics: data.plainLyrics,
          syncedLyrics: data.syncedLyrics ?? null,
        },
      });
    } catch (err) {
      console.error(err);
      setCacheEntry(key, { status: "error" });
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, fetchPromise);
  return fetchPromise;
}

const IDLE_RESULT: UseTrackLyricsResult = { status: "idle", lyrics: null };
const LOADING_RESULT: UseTrackLyricsResult = {
  status: "loading",
  lyrics: null,
};

function readLyricsCache(key: string | null): UseTrackLyricsResult {
  if (!key) return IDLE_RESULT;

  const cached = lyricsCache.get(key);
  if (cached) return resultFromCache(cached);

  if (inflight.has(key)) return LOADING_RESULT;

  return LOADING_RESULT;
}

export function useTrackLyrics({
  enabled,
  contentId,
  title,
  artist,
  album,
  durationMs,
}: LyricsQuery): UseTrackLyricsResult {
  hydrateSessionCache();

  const key =
    enabled && title && artist
      ? buildLyricsCacheKey({ contentId, title, artist, album, durationMs })
      : null;

  useEffect(() => {
    if (!enabled || !title || !artist) return;

    void prefetchTrackLyrics({ contentId, title, artist, album, durationMs });
  }, [enabled, contentId, title, artist, album, durationMs]);

  const version = useSyncExternalStore(
    subscribeToLyricsCache,
    getLyricsCacheVersion,
    getLyricsCacheVersion,
  );

  void version;

  return readLyricsCache(key);
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
  inflight.clear();
  cacheListeners.clear();
  cacheVersion = 0;
  sessionHydrated = false;

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export { buildLyricsCacheKey };
