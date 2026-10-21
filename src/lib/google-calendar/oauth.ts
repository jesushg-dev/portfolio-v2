import "server-only";

import { randomBytes, createHash } from "crypto";

import { GOOGLE_CALENDAR_REQUIRED_SCOPES } from "@/utils/services/google-calendar-scopes";

import { getGoogleCalendarRedirectUri } from "./redirect-uri";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export function generateOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCodeVerifier(): string {
  return randomBytes(64).toString("base64url");
}

export function generateCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function buildGoogleCalendarAuthorizeUrl(params: {
  clientId: string;
  state: string;
  codeChallenge: string;
}): string {
  const search = new URLSearchParams({
    client_id: params.clientId,
    response_type: "code",
    redirect_uri: getGoogleCalendarRedirectUri(),
    state: params.state,
    scope: GOOGLE_CALENDAR_REQUIRED_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    code_challenge_method: "S256",
    code_challenge: params.codeChallenge,
  });

  return `${GOOGLE_AUTHORIZE_URL}?${search.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
}

export class GoogleCalendarTokenError extends Error {
  readonly status: number;
  readonly errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "GoogleCalendarTokenError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

async function parseGoogleTokenError(
  response: Response,
  action: "exchange" | "refresh",
): Promise<never> {
  const text = await response.text();
  let errorCode: string | undefined;

  try {
    const parsed = JSON.parse(text) as { error?: string };
    errorCode = parsed.error;
  } catch {
    // Google may return plain text on some failures.
  }

  throw new GoogleCalendarTokenError(
    `Google Calendar token ${action} failed: ${response.status} ${text}`,
    response.status,
    errorCode,
  );
}

export async function exchangeGoogleCalendarAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
}): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: getGoogleCalendarRedirectUri(),
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return parseGoogleTokenError(response, "exchange");
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function refreshGoogleCalendarAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return parseGoogleTokenError(response, "refresh");
  }

  return (await response.json()) as GoogleTokenResponse;
}
