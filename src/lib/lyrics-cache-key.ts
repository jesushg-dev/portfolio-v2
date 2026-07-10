export function buildLyricsServerCacheKey(params: {
  spotifyId?: string;
  artist: string;
  title: string;
  album: string;
  durationSeconds?: number;
}): string {
  if (params.spotifyId) {
    return `spotify:${params.spotifyId}`;
  }

  const duration =
    params.durationSeconds != null && params.durationSeconds > 0
      ? String(params.durationSeconds)
      : "0";

  return [
    params.artist.toLowerCase(),
    params.title.toLowerCase(),
    params.album.toLowerCase(),
    duration,
  ].join("|");
}
