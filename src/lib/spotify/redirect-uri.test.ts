const mockEnv = {
  NODE_ENV: "development" as "development" | "test" | "production",
  PRIMARY_DOMAIN: "example.com",
  NEXT_PUBLIC_DEV_DOMAIN: "lvh.me:3000",
};

jest.mock("@/env", () => ({
  get env() {
    return mockEnv;
  },
}));

import { getDevLoopbackOrigin, getSpotifyRedirectUri } from "./redirect-uri";

describe("getSpotifyRedirectUri", () => {
  beforeEach(() => {
    mockEnv.NODE_ENV = "development";
    mockEnv.PRIMARY_DOMAIN = "example.com";
    mockEnv.NEXT_PUBLIC_DEV_DOMAIN = "lvh.me:3000";
  });

  it("uses Spotify-allowed loopback IP in development", () => {
    expect(getSpotifyRedirectUri()).toBe(
      "http://127.0.0.1:3000/api/spotify/callback",
    );
  });

  it("uses HTTPS primary domain in production", () => {
    mockEnv.NODE_ENV = "production";
    mockEnv.PRIMARY_DOMAIN = "jesushg.com";

    expect(getSpotifyRedirectUri()).toBe(
      "https://jesushg.com/api/spotify/callback",
    );
  });
});

describe("getDevLoopbackOrigin", () => {
  it("derives port from NEXT_PUBLIC_DEV_DOMAIN", () => {
    mockEnv.NEXT_PUBLIC_DEV_DOMAIN = "lvh.me:3001";

    expect(getDevLoopbackOrigin()).toBe("http://127.0.0.1:3001");
  });
});
