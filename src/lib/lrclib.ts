const LRCLIB_BASE = "https://lrclib.net";
const LRCLIB_FETCH_TIMEOUT_MS = 12_000;
const USER_AGENT =
  "portfolio-v2/0.1 (https://github.com; lyrics demo for Spotify widget)";

export interface LrclibTrack {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export interface LrclibLyricsResult {
  plainLyrics: string;
  syncedLyrics: string | null;
  source: "lrclib";
}

export class LrclibUpstreamError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LrclibUpstreamError";
    this.status = status;
  }
}

function isRetryableUpstreamStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function lrclibFetch(path: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    LRCLIB_FETCH_TIMEOUT_MS,
  );

  try {
    return await fetch(`${LRCLIB_BASE}${path}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LrclibUpstreamError(
        408,
        "LRCLIB request timed out while searching external sources",
      );
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readLrclibResponse<T>(res: Response): Promise<T | null> {
  if (res.status === 404) return null;

  if (isRetryableUpstreamStatus(res.status)) {
    let message = `LRCLIB upstream error (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Ignore non-JSON error bodies.
    }
    throw new LrclibUpstreamError(res.status, message);
  }

  if (!res.ok) {
    throw new LrclibUpstreamError(
      res.status,
      `LRCLIB unexpected response (${res.status})`,
    );
  }

  return (await res.json()) as T;
}

export async function getLrclibBySignature(params: {
  artistName: string;
  trackName: string;
  albumName: string;
  durationSeconds: number;
}): Promise<LrclibTrack | null> {
  const query = new URLSearchParams({
    artist_name: params.artistName,
    track_name: params.trackName,
    album_name: params.albumName,
    duration: String(Math.round(params.durationSeconds)),
  });

  const res = await lrclibFetch(`/api/get?${query.toString()}`);
  return readLrclibResponse<LrclibTrack>(res);
}

export async function searchLrclib(params: {
  artistName: string;
  trackName: string;
}): Promise<LrclibTrack[]> {
  const query = new URLSearchParams({
    track_name: params.trackName,
    artist_name: params.artistName,
  });

  const res = await lrclibFetch(`/api/search?${query.toString()}`);
  const data = await readLrclibResponse<LrclibTrack[]>(res);
  return data ?? [];
}

function pickLyrics(
  track: LrclibTrack | null | undefined,
): LrclibLyricsResult | null {
  if (!track?.plainLyrics?.trim()) return null;
  return {
    plainLyrics: track.plainLyrics,
    syncedLyrics: track.syncedLyrics,
    source: "lrclib",
  };
}

/** Resolve lyrics: exact signature first, then search fallback. */
export async function resolveLrclibLyrics(params: {
  artistName: string;
  trackName: string;
  albumName?: string;
  durationSeconds?: number;
}): Promise<LrclibLyricsResult | null> {
  const { artistName, trackName, albumName, durationSeconds } = params;

  if (albumName && durationSeconds != null && durationSeconds > 0) {
    const exact = await getLrclibBySignature({
      artistName,
      trackName,
      albumName,
      durationSeconds,
    });
    const fromExact = pickLyrics(exact);
    if (fromExact) return fromExact;
  }

  const hits = await searchLrclib({ artistName, trackName });
  for (const hit of hits) {
    const lyrics = pickLyrics(hit);
    if (lyrics) return lyrics;
  }

  return null;
}
