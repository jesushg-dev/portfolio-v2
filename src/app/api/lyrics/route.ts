import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { resolveLrclibLyrics } from "@/lib/lrclib";

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist")?.trim() ?? "";
  const title = req.nextUrl.searchParams.get("title")?.trim() ?? "";
  const album = req.nextUrl.searchParams.get("album")?.trim() ?? "";
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

  try {
    const lyrics = await resolveLrclibLyrics({
      artistName: artist,
      trackName: title,
      albumName: album || undefined,
      durationSeconds:
        durationSeconds != null && Number.isFinite(durationSeconds)
          ? durationSeconds
          : undefined,
    });

    if (!lyrics) {
      return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
    }

    return NextResponse.json(lyrics);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error fetching lyrics" },
      { status: 500 },
    );
  }
}
