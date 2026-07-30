import { z } from "zod";

import type {
  ErrorResponse,
  NowPlayingResponse,
  QueueResponse,
  RecentlyPlayedResponse,
} from "@/utils/interfaces/spotify";
import type { Track } from "@/utils/interfaces/spotify/entities";
import {
  clearSpotifyAccessTokenCache,
  getSpotifyAccessTokenForUser,
  getSpotifyConnectionForUser,
} from "@/lib/spotify/connection";

import type { SpotifyResponse } from "@/utils/interfaces/spotify";

export type TimeRangeType = "short_term" | "medium_term" | "long_term";

const URL_SPOTIFY = "https://api.spotify.com/";

const SpotifyErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    status: z.number(),
  }),
});

async function resolveMissingAccessTokenError(
  userId: string,
): Promise<ErrorResponse> {
  const connection = await getSpotifyConnectionForUser(userId);
  if (!connection) {
    return {
      error: {
        message: "Spotify not connected",
        status: 503,
      },
    };
  }

  return {
    error: {
      message: "Spotify temporarily unavailable",
      status: 502,
    },
  };
}

async function fetchSpotifyEndpoint<T>(
  endpoint: string,
  accessToken: string,
  body: Record<string, unknown> | undefined,
  method: "GET" | "POST" | "PUT" | "DELETE",
): Promise<T | ErrorResponse> {
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
  if (errorParsed.success) return errorParsed.data;

  throw new Error(
    `Unexpected error: ${response.status} ${response.statusText}`,
  );
}

const buildSpotifyRequest = async <T>(
  userId: string,
  endpoint: string,
  body?: Record<string, unknown>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
): Promise<T | ErrorResponse> => {
  try {
    let accessToken = await getSpotifyAccessTokenForUser(userId);
    if (!accessToken) {
      return resolveMissingAccessTokenError(userId);
    }

    let result = await fetchSpotifyEndpoint<T>(
      endpoint,
      accessToken,
      body,
      method,
    );

    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      result.error.status === 401
    ) {
      clearSpotifyAccessTokenCache(userId);
      accessToken = await getSpotifyAccessTokenForUser(userId, {
        forceRefresh: true,
      });

      if (!accessToken) {
        return resolveMissingAccessTokenError(userId);
      }

      result = await fetchSpotifyEndpoint<T>(
        endpoint,
        accessToken,
        body,
        method,
      );
    }

    return result;
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
export const getNowPlaying = async (userId: string) =>
  buildSpotifyRequest<NowPlayingResponse>(userId, NOW_PLAYING_ENDPOINT);

const QUEUE_ENDPOINT = `${URL_SPOTIFY}v1/me/player/queue`;
export const getQueue = async (userId: string) =>
  buildSpotifyRequest<QueueResponse>(userId, QUEUE_ENDPOINT);

const RECENTLY_PLAYED_ENDPOINT = `${URL_SPOTIFY}v1/me/player/recently-played?limit=3`;
export const getRecentlyPlayed = async (userId: string) =>
  buildSpotifyRequest<RecentlyPlayedResponse>(userId, RECENTLY_PLAYED_ENDPOINT);

const TOP_TRACKS_ENDPOINT = "v1/me/top/tracks";
export const getTopTracks = async (
  userId: string,
  timeRange: TimeRangeType,
  limit: number,
  offset: number,
) =>
  buildSpotifyRequest<SpotifyResponse<Track>>(
    userId,
    `${URL_SPOTIFY}${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
  );
