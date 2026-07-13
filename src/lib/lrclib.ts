const LRCLIB_BASE = "https://lrclib.net";
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

async function lrclibFetch(path: string): Promise<Response> {
  return fetch(`${LRCLIB_BASE}${path}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    cache: "no-store",
  });
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
  if (!res.ok) return null;
  return (await res.json()) as LrclibTrack;
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
  if (!res.ok) return [];
  return (await res.json()) as LrclibTrack[];
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
