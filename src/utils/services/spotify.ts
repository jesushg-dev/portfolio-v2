import type {
  PlayHistoryObject,
  SpotifyResponse,
  ErrorResponse,
  NowPlayingResponse,
} from "@/utils/interfaces/spotify";

const URL_SPOTIFY = "https://api.spotify.com/";
const clientId = process.env.SPOTIFY_CLIENT_ID || "";
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
const refreshToken = process.env.SPOTIFY_CLIENT_REFRESH_TOKEN || "";

const basicAuthHeader = btoa(`${clientId}:${clientSecret}`);
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
export type TimeRangeType = "short_term" | "medium_term" | "long_term";

const serialize = (
  obj: Record<string | number, string | number | boolean>,
): string => {
  const str = Object.entries(obj).map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
  );
  return str.join("&");
};

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuthHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: serialize({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    next: {
      revalidate: 3600,
    },
  });

  return response.json();
};

const buildSpotifyRequest = async <T>(
  endpoint: string,
  body: Record<string, unknown> | undefined,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
): Promise<T | ErrorResponse> => {
  const { access_token: accessToken } = await getAccessToken();
  const response = await fetch(endpoint, {
    body: body && method !== "GET" ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method,
  });
  try {
    const json = await response.json();
    if (response.ok) return json as T;
    return json as ErrorResponse;
  } catch (e) {
    return {
      error: {
        message: response.statusText || "Server error",
        status: response.status || 500,
      },
    };
  }
};

const NOW_PLAYING_ENDPOINT = `${URL_SPOTIFY}v1/me/player/currently-playing`;
export const getNowPlaying = async () =>
  buildSpotifyRequest<NowPlayingResponse>(NOW_PLAYING_ENDPOINT, undefined);

const RECENTLY_PLAYED_ENDPOINT = `${URL_SPOTIFY}v1/me/player/recently-played?limit=1`;
export const getRecentlyPlayed = async () =>
  buildSpotifyRequest<SpotifyResponse<PlayHistoryObject>>(
    RECENTLY_PLAYED_ENDPOINT,
    undefined,
  );

const TOP_TRACKS_ENDPOINT = "v1/me/top/tracks";
export const getTopTracks = async (
  timeRange: TimeRangeType,
  limit: number,
  offset: number,
) =>
  buildSpotifyRequest<SpotifyResponse<PlayHistoryObject>>(
    `${URL_SPOTIFY}${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
    undefined,
  );
