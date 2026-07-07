import type { ErrorResponse } from "@/utils/interfaces/spotify";

export interface SpotifyApiError {
  status: number;
  message: string;
}

/** Scopes required when authorizing the Spotify refresh token. */
export const SPOTIFY_REQUIRED_SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-recently-played",
] as const;

export function isInsufficientScopeError(
  data: ErrorResponse | Record<string, unknown> | undefined,
): boolean {
  if (
    !data ||
    !("error" in data) ||
    typeof data.error !== "object" ||
    data.error === null
  ) {
    return false;
  }

  const error = data.error as { status?: number; message?: string };
  const { status, message } = error;

  return (
    status === 403 &&
    typeof message === "string" &&
    message.toLowerCase().includes("scope")
  );
}

export function getSpotifyQueryError(data: unknown): SpotifyApiError | null {
  if (!data || typeof data !== "object" || !("error" in data)) {
    return null;
  }

  const record = data as { error?: unknown };
  if (typeof record.error !== "object" || record.error === null) {
    return null;
  }

  const error = record.error as { status?: number; message?: string };

  if (typeof error.status !== "number" || typeof error.message !== "string") {
    return null;
  }

  if (
    isInsufficientScopeError({
      error: { status: error.status, message: error.message },
    })
  ) {
    return null;
  }

  return { status: error.status, message: error.message };
}

export function resolveSpotifyUrl(
  ...candidates: Array<string | undefined>
): string {
  for (const candidate of candidates) {
    if (candidate) return candidate;
  }

  return "https://open.spotify.com";
}
