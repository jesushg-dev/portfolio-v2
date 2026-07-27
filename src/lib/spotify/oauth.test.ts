jest.mock("@/lib/spotify/redirect-uri", () => ({
  getSpotifyRedirectUri: () => "http://127.0.0.1:3000/api/spotify/callback",
}));

import {
  buildSpotifyAuthorizeUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
  SpotifyTokenError,
  exchangeSpotifyAuthorizationCode,
  refreshSpotifyAccessToken,
} from "./oauth";
import { getSpotifyRedirectUri } from "./redirect-uri";

const mockTokenResponse = {
  access_token: "access-123",
  token_type: "Bearer",
  scope: "user-read-currently-playing",
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

describe("spotify oauth helpers", () => {
  it("builds authorize URL with PKCE and required scopes", () => {
    const state = generateOAuthState();
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    const url = buildSpotifyAuthorizeUrl({
      clientId: "client-id",
      state,
      codeChallenge: challenge,
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://accounts.spotify.com/authorize",
    );
    expect(parsed.searchParams.get("client_id")).toBe("client-id");
    expect(parsed.searchParams.get("state")).toBe(state);
    expect(parsed.searchParams.get("code_challenge")).toBe(challenge);
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      getSpotifyRedirectUri(),
    );
    expect(parsed.searchParams.get("scope")).toContain(
      "user-read-currently-playing",
    );
  });

  it("generates unique state values", () => {
    expect(generateOAuthState()).not.toBe(generateOAuthState());
  });
});

describe("SpotifyTokenError", () => {
  it("stores status and errorCode", () => {
    const error = new SpotifyTokenError("Token failed", 401, "invalid_grant");
    expect(error.name).toBe("SpotifyTokenError");
    expect(error.message).toBe("Token failed");
    expect(error.status).toBe(401);
    expect(error.errorCode).toBe("invalid_grant");
    expect(error instanceof Error).toBe(true);
  });

  it("works without errorCode", () => {
    const error = new SpotifyTokenError("Failed", 500);
    expect(error.errorCode).toBeUndefined();
  });
});

describe("exchangeSpotifyAuthorizationCode", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns token response on success", async () => {
    mockFetch(mockTokenResponse, true, 200);

    const result = await exchangeSpotifyAuthorizationCode({
      clientId: "cid",
      clientSecret: "csecret",
      code: "auth-code",
      codeVerifier: "verifier",
    });

    expect(result.access_token).toBe("access-123");
    expect(result.refresh_token).toBe("refresh-abc");
  });

  it("throws SpotifyTokenError on non-ok response with JSON error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ error: "invalid_grant" })),
    });

    await expect(
      exchangeSpotifyAuthorizationCode({
        clientId: "cid",
        clientSecret: "csecret",
        code: "bad-code",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(SpotifyTokenError);
  });

  it("throws SpotifyTokenError on non-ok response with plain text error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    await expect(
      exchangeSpotifyAuthorizationCode({
        clientId: "cid",
        clientSecret: "csecret",
        code: "bad-code",
        codeVerifier: "verifier",
      }),
    ).rejects.toMatchObject({ status: 500 });
  });
});

describe("refreshSpotifyAccessToken", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns token response on success", async () => {
    mockFetch(mockTokenResponse, true, 200);

    const result = await refreshSpotifyAccessToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "refresh-token",
    });

    expect(result.access_token).toBe("access-123");
  });

  it("throws SpotifyTokenError on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ error: "token_expired" })),
    });

    await expect(
      refreshSpotifyAccessToken({
        clientId: "cid",
        clientSecret: "csecret",
        refreshToken: "bad-refresh",
      }),
    ).rejects.toThrow(SpotifyTokenError);
  });
});
