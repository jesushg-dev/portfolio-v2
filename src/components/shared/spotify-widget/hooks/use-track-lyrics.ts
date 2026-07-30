"use client";

import { useEffect, useSyncExternalStore } from "react";

import type {
  LyricsCacheEntry,
  LyricsPrefetchMode,
  TrackLyricsPayload,
  TrackLyricsRequest,
} from "../types/track-lyrics-types";
import { buildLyricsServerCacheKey } from "@/lib/lyrics-cache-key";

type LyricsStatus = "idle" | "loading" | "ready" | "empty" | "temporary";

export type TrackLyrics = TrackLyricsPayload;

export interface UseTrackLyricsResult {
  status: LyricsStatus;
  lyrics: TrackLyrics | null;
}

type LyricsQuery = TrackLyricsRequest & {
  enabled: boolean;
};

const SESSION_STORAGE_KEY = "spotify-lyrics-cache-v3";
const MAX_SESSION_ENTRIES = 40;
/** Background prefetches may retry empty/error after this window. */
const BACKGROUND_MISS_RETRY_MS = 10 * 60 * 1000;

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
  return buildLyricsServerCacheKey({
    spotifyId: request.contentId,
    artist: request.artist,
    title: request.title,
    album: request.album,
    durationSeconds: Math.round(request.durationMs / 1000),
  });
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
      if (entry.status !== "ready" || lyricsCache.has(key)) continue;
      lyricsCache.set(key, entry);
    }
  } catch {
    // Ignore corrupt session cache.
  }
}

function persistSessionCache(): void {
  if (typeof window === "undefined") return;

  const entries = [...lyricsCache.entries()]
    .filter(([, entry]) => entry.status === "ready")
    .slice(-MAX_SESSION_ENTRIES);

  try {
    if (entries.length === 0) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

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

function isRecentMiss(entry: LyricsCacheEntry): boolean {
  if (entry.status !== "empty" && entry.status !== "temporary") return false;
  return Date.now() - entry.cachedAt < BACKGROUND_MISS_RETRY_MS;
}

function shouldSkipPrefetch(
  key: string,
  mode: LyricsPrefetchMode = "background",
): boolean {
  const cached = lyricsCache.get(key);
  if (!cached) return false;
  if (cached.status === "ready") return true;
  if (mode === "active") return false;

  return isRecentMiss(cached);
}

function clearStaleEntryForActiveFetch(key: string): void {
  const cached = lyricsCache.get(key);
  if (!cached || cached.status === "ready") return;

  lyricsCache.delete(key);
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

function parseLyricsPayload(data: {
  plainLyrics?: string;
  syncedLyrics?: string | null;
}): TrackLyricsPayload | null {
  const plainLyrics = data.plainLyrics?.trim();
  const syncedLyrics = data.syncedLyrics ?? null;

  if (plainLyrics) {
    return { plainLyrics, syncedLyrics };
  }

  return null;
}

export async function prefetchTrackLyrics(
  request: TrackLyricsRequest,
  mode: LyricsPrefetchMode = "background",
): Promise<void> {
  hydrateSessionCache();

  if (!request.title || !request.artist) return Promise.resolve();

  const key = buildLyricsCacheKey(request);
  if (shouldSkipPrefetch(key, mode)) return Promise.resolve();

  const pending = inflight.get(key);
  if (pending) return pending;

  if (mode === "active") {
    clearStaleEntryForActiveFetch(key);
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(buildLyricsUrl(request));

      if (res.status === 404) {
        setCacheEntry(key, { status: "empty", cachedAt: Date.now() });
        return;
      }

      if (!res.ok) {
        setCacheEntry(key, { status: "temporary", cachedAt: Date.now() });
        return;
      }

      const data = (await res.json()) as {
        plainLyrics?: string;
        syncedLyrics?: string | null;
      };

      const payload = parseLyricsPayload(data);
      if (!payload) {
        setCacheEntry(key, { status: "empty", cachedAt: Date.now() });
        return;
      }

      setCacheEntry(key, {
        status: "ready",
        lyrics: payload,
      });
    } catch (err) {
      console.error(err);
      setCacheEntry(key, { status: "temporary", cachedAt: Date.now() });
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

    void prefetchTrackLyrics(
      { contentId, title, artist, album, durationMs },
      "active",
    );
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
