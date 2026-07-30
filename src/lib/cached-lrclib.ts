import { unstable_cache } from "next/cache";

import {
  resolveLrclibLyrics,
  LrclibUpstreamError,
  type LrclibLyricsResult,
} from "@/lib/lrclib";

const LYRICS_REVALIDATE_SECONDS = 60 * 60 * 24 * 7;

class LyricsNotFoundError extends Error {
  constructor() {
    super("Lyrics not found");
    this.name = "LyricsNotFoundError";
  }
}

export async function getCachedLrclibLyrics(params: {
  cacheKey: string;
  artistName: string;
  trackName: string;
  albumName?: string;
  durationSeconds?: number;
}): Promise<LrclibLyricsResult | null> {
  const { cacheKey, artistName, trackName, albumName, durationSeconds } =
    params;

  try {
    return await unstable_cache(
      async () => {
        const lyrics = await resolveLrclibLyrics({
          artistName,
          trackName,
          albumName,
          durationSeconds,
        });

        if (!lyrics) {
          throw new LyricsNotFoundError();
        }

        return lyrics;
      },
      ["lrclib-lyrics", cacheKey],
      {
        revalidate: LYRICS_REVALIDATE_SECONDS,
        tags: [`lyrics-${cacheKey}`],
      },
    )();
  } catch (err) {
    if (err instanceof LyricsNotFoundError) {
      return null;
    }

    if (err instanceof LrclibUpstreamError) {
      throw err;
    }

    throw err;
  }
}
