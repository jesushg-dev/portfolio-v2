import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildLyricsServerCacheKey } from "@/lib/lyrics-cache-key";
import { getCachedLrclibLyrics } from "@/lib/cached-lrclib";
import { LrclibUpstreamError } from "@/lib/lrclib";

const LYRICS_CACHE_CONTROL =
  "public, s-maxage=604800, stale-while-revalidate=86400";

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist")?.trim() ?? "";
  const title = req.nextUrl.searchParams.get("title")?.trim() ?? "";
  const album = req.nextUrl.searchParams.get("album")?.trim() ?? "";
  const spotifyId = req.nextUrl.searchParams.get("spotifyId")?.trim() ?? "";
  const durationParam = req.nextUrl.searchParams.get("duration");

  if (!artist || !title) {
    return NextResponse.json(
      { error: "Missing required 'artist' and 'title' query params" },
      { status: 400 },
    );
  }

  const durationSeconds =
    durationParam != null && durationParam !== ""
      ? Number(durationParam)
      : undefined;

  const cacheKey = buildLyricsServerCacheKey({
    spotifyId: spotifyId || undefined,
    artist,
    title,
    album,
    durationSeconds:
      durationSeconds != null && Number.isFinite(durationSeconds)
        ? durationSeconds
        : undefined,
  });

  try {
    const lyrics = await getCachedLrclibLyrics({
      cacheKey,
      artistName: artist,
      trackName: title,
      albumName: album || undefined,
      durationSeconds:
        durationSeconds != null && Number.isFinite(durationSeconds)
          ? durationSeconds
          : undefined,
    });

    if (!lyrics) {
      return NextResponse.json(
        { error: "Lyrics not found" },
        {
          status: 404,
          headers: {
            "Cache-Control":
              "public, s-maxage=86400, stale-while-revalidate=3600",
          },
        },
      );
    }

    return NextResponse.json(lyrics, {
      headers: { "Cache-Control": LYRICS_CACHE_CONTROL },
    });
  } catch (err) {
    if (err instanceof LrclibUpstreamError) {
      console.error("[lyrics] LRCLIB upstream:", err.message);
      return NextResponse.json(
        {
          error: err.message,
          retryable: true,
          upstreamStatus: err.status,
        },
        {
          status: err.status === 408 ? 504 : 502,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    console.error(err);
    return NextResponse.json(
      { error: "Error fetching lyrics" },
      { status: 500 },
    );
  }
}
