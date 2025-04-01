import { z } from "zod";

import type {
  PlayHistoryObject,
  SpotifyResponse,
  ErrorResponse,
  NowPlayingResponse,
} from "@/utils/interfaces/spotify";

const URL_SPOTIFY = "https://api.spotify.com/";
const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const refreshToken = process.env.SPOTIFY_CLIENT_REFRESH_TOKEN ?? "";

const basicAuthHeader = btoa(`${clientId}:${clientSecret}`);
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

export type TimeRangeType = "short_term" | "medium_term" | "long_term";

const TokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

const SpotifyErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    status: z.number(),
  }),
});

const serialize = (obj: Record<string, string>): string =>
  Object.entries(obj)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");

const getAccessToken = async (): Promise<
  z.infer<typeof TokenResponseSchema>
> => {
  try {
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
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch token: ${response.status} ${response.statusText}`,
      );
    }

    const json: unknown = await response.json();
    const parsed = TokenResponseSchema.safeParse(json);

    if (!parsed.success) {
      console.error("Invalid Spotify token response:", parsed.error);
      throw new Error("Invalid token response format");
    }

    return parsed.data;
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw error;
  }
};

const buildSpotifyRequest = async <T>(
  endpoint: string,
  body?: Record<string, unknown>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
): Promise<T | ErrorResponse> => {
  try {
    const { access_token: accessToken } = await getAccessToken();
    const response = await fetch(endpoint, {
      body: body && method !== "GET" ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method,
    });

    if (response.status === 204) {
      return {
        error: {
          message: "No content",
          status: 204,
        },
      };
    }

    const json: unknown = await response.json();
    if (response.ok) return json as T;

    const errorParsed = SpotifyErrorSchema.safeParse(json);
    if (errorParsed.success) return errorParsed.data as ErrorResponse;
    throw new Error(
      `Unexpected error: ${response.status} ${response.statusText}`,
    );
  } catch (error) {
    console.error("Error in Spotify request:", error);
    return {
      error: {
        message: (error as Error)?.message ?? "Unexpected error",
        status: 500,
      },
    };
  }
};

const NOW_PLAYING_ENDPOINT = `${URL_SPOTIFY}v1/me/player/currently-playing`;
export const getNowPlaying = async () =>
  buildSpotifyRequest<NowPlayingResponse>(NOW_PLAYING_ENDPOINT);

const RECENTLY_PLAYED_ENDPOINT = `${URL_SPOTIFY}v1/me/player/recently-played?limit=1`;
export const getRecentlyPlayed = async () =>
  buildSpotifyRequest<SpotifyResponse<PlayHistoryObject>>(
    RECENTLY_PLAYED_ENDPOINT,
  );

const TOP_TRACKS_ENDPOINT = "v1/me/top/tracks";
export const getTopTracks = async (
  timeRange: TimeRangeType,
  limit: number,
  offset: number,
) =>
  buildSpotifyRequest<SpotifyResponse<PlayHistoryObject>>(
    `${URL_SPOTIFY}${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
  );
