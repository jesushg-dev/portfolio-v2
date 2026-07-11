jest.mock("@/lib/spotify/redirect-uri", () => ({
  getSpotifyRedirectUri: () => "http://127.0.0.1:3000/api/spotify/callback",
}));

import {
  buildSpotifyAuthorizeUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "./oauth";
import { getSpotifyRedirectUri } from "./redirect-uri";

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
