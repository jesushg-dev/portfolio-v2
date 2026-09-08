jest.mock("@/lib/google-calendar/redirect-uri", () => ({
  getGoogleCalendarRedirectUri: () =>
    "http://127.0.0.1:3000/api/google-calendar/callback",
}));

import {
  buildGoogleCalendarAuthorizeUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
  GoogleCalendarTokenError,
  exchangeGoogleCalendarAuthorizationCode,
  refreshGoogleCalendarAccessToken,
} from "./oauth";
import { getGoogleCalendarRedirectUri } from "./redirect-uri";
import { GOOGLE_CALENDAR_REQUIRED_SCOPES } from "@/utils/services/google-calendar-scopes";

const mockTokenResponse = {
  access_token: "access-123",
  token_type: "Bearer",
  scope: GOOGLE_CALENDAR_REQUIRED_SCOPES.join(" "),
  expires_in: 3600,
  refresh_token: "refresh-abc",
};

function mockFetch(body: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe("google calendar oauth helpers", () => {
  it("builds authorize URL with BYO clientId, PKCE, offline access, and calendar.events scope", () => {
    const state = generateOAuthState();
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    const url = buildGoogleCalendarAuthorizeUrl({
      clientId: "tenant-client-id",
      state,
      codeChallenge: challenge,
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(parsed.searchParams.get("client_id")).toBe("tenant-client-id");
    expect(parsed.searchParams.get("state")).toBe(state);
    expect(parsed.searchParams.get("code_challenge")).toBe(challenge);
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("access_type")).toBe("offline");
    expect(parsed.searchParams.get("prompt")).toBe("consent");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      getGoogleCalendarRedirectUri(),
    );
    expect(parsed.searchParams.get("scope")).toContain(
      "https://www.googleapis.com/auth/calendar.events",
    );
  });

  it("generates unique state values", () => {
    expect(generateOAuthState()).not.toBe(generateOAuthState());
  });
});

describe("GoogleCalendarTokenError", () => {
  it("stores status and errorCode", () => {
    const error = new GoogleCalendarTokenError(
      "Token failed",
      401,
      "invalid_grant",
    );
    expect(error.name).toBe("GoogleCalendarTokenError");
    expect(error.status).toBe(401);
    expect(error.errorCode).toBe("invalid_grant");
  });
});

describe("exchangeGoogleCalendarAuthorizationCode", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns token response on success", async () => {
    mockFetch(mockTokenResponse, true, 200);

    const result = await exchangeGoogleCalendarAuthorizationCode({
      clientId: "cid",
      clientSecret: "csecret",
      code: "auth-code",
      codeVerifier: "verifier",
    });

    expect(result.access_token).toBe("access-123");
    expect(result.refresh_token).toBe("refresh-abc");
  });

  it("throws GoogleCalendarTokenError on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ error: "invalid_grant" })),
    });

    await expect(
      exchangeGoogleCalendarAuthorizationCode({
        clientId: "cid",
        clientSecret: "csecret",
        code: "bad-code",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(GoogleCalendarTokenError);
  });
});

describe("refreshGoogleCalendarAccessToken", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns token response on success", async () => {
    mockFetch(mockTokenResponse, true, 200);

    const result = await refreshGoogleCalendarAccessToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "refresh-token",
    });

    expect(result.access_token).toBe("access-123");
  });
});
