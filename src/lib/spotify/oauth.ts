import "server-only";

import { randomBytes, createHash } from "crypto";

import { SPOTIFY_REQUIRED_SCOPES } from "@/utils/services/spotify-scopes";

import { getSpotifyRedirectUri } from "./redirect-uri";

const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

export function generateOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCodeVerifier(): string {
  return randomBytes(64).toString("base64url");
}

export function generateCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function buildSpotifyAuthorizeUrl(params: {
  clientId: string;
  state: string;
  codeChallenge: string;
}): string {
  const search = new URLSearchParams({
    client_id: params.clientId,
    response_type: "code",
    redirect_uri: getSpotifyRedirectUri(),
    state: params.state,
    scope: SPOTIFY_REQUIRED_SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: params.codeChallenge,
    show_dialog: "true",
  });

  return `${SPOTIFY_AUTHORIZE_URL}?${search.toString()}`;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export class SpotifyTokenError extends Error {
  readonly status: number;
  readonly errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "SpotifyTokenError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

async function parseSpotifyTokenError(
  response: Response,
  action: "exchange" | "refresh",
): Promise<never> {
  const text = await response.text();
  let errorCode: string | undefined;

  try {
    const parsed = JSON.parse(text) as { error?: string };
    errorCode = parsed.error;
  } catch {
    // Spotify may return plain text on some failures.
  }

  throw new SpotifyTokenError(
    `Spotify token ${action} failed: ${response.status} ${text}`,
    response.status,
    errorCode,
  );
}

export async function exchangeSpotifyAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
}): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: getSpotifyRedirectUri(),
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  });

  const basicAuth = Buffer.from(
    `${params.clientId}:${params.clientSecret}`,
  ).toString("base64");

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return parseSpotifyTokenError(response, "exchange");
  }

  return (await response.json()) as SpotifyTokenResponse;
}

export async function refreshSpotifyAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
  });

  const basicAuth = Buffer.from(
    `${params.clientId}:${params.clientSecret}`,
  ).toString("base64");

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return parseSpotifyTokenError(response, "refresh");
  }

  return (await response.json()) as SpotifyTokenResponse;
}
