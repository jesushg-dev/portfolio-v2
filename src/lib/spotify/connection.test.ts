jest.mock("@/env", () => ({
  env: { BETTER_AUTH_SECRET: "test-secret-for-spotify-encryption" },
}));

const mockFindUnique = jest.fn<
  Promise<{
    userId: string;
    clientId: string;
    clientSecretEnc: string;
    refreshTokenEnc: string;
  } | null>,
  [unknown?]
>();
const mockUpdate = jest.fn<Promise<void>, [unknown?]>();
const mockRefreshSpotifyAccessToken = jest.fn<
  Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
  }>,
  [unknown?]
>();

jest.mock("@/server/db", () => ({
  db: {
    spotifyConnection: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

jest.mock("./oauth", () => ({
  refreshSpotifyAccessToken: (...args: unknown[]) =>
    mockRefreshSpotifyAccessToken(...args),
  SpotifyTokenError: class SpotifyTokenError extends Error {
    status: number;
    errorCode?: string;

    constructor(message: string, status: number, errorCode?: string) {
      super(message);
      this.name = "SpotifyTokenError";
      this.status = status;
      this.errorCode = errorCode;
    }
  },
}));

import { encryptSecret } from "./crypto";
import {
  clearSpotifyAccessTokenCache,
  getSpotifyAccessTokenForUser,
} from "./connection";
import { SpotifyTokenError } from "./oauth";

describe("getSpotifyAccessTokenForUser", () => {
  beforeEach(() => {
    clearSpotifyAccessTokenCache();
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockRefreshSpotifyAccessToken.mockReset();
    mockUpdate.mockResolvedValue(undefined);
  });

  it("clears lastRefreshErrorAt when refresh succeeds without a new refresh token", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      clientId: "client-id",
      clientSecretEnc: encryptSecret("client-secret"),
      refreshTokenEnc: encryptSecret("refresh-token"),
    });
    mockRefreshSpotifyAccessToken.mockResolvedValue({
      access_token: "access-token",
      token_type: "Bearer",
      scope: "user-read-currently-playing",
      expires_in: 3600,
    });

    await expect(getSpotifyAccessTokenForUser("user-1")).resolves.toBe(
      "access-token",
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: {
        scope: "user-read-currently-playing",
        lastRefreshErrorAt: null,
      },
    });
  });

  it("does not mark refresh_error on transient failures", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      clientId: "client-id",
      clientSecretEnc: encryptSecret("client-secret"),
      refreshTokenEnc: encryptSecret("refresh-token"),
    });
    mockRefreshSpotifyAccessToken.mockRejectedValue(
      new SpotifyTokenError("rate limited", 429),
    );

    await expect(getSpotifyAccessTokenForUser("user-1")).resolves.toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("marks refresh_error on invalid_grant", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      clientId: "client-id",
      clientSecretEnc: encryptSecret("client-secret"),
      refreshTokenEnc: encryptSecret("refresh-token"),
    });
    mockRefreshSpotifyAccessToken.mockRejectedValue(
      new SpotifyTokenError("invalid grant", 400, "invalid_grant"),
    );

    await expect(getSpotifyAccessTokenForUser("user-1")).resolves.toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { lastRefreshErrorAt: expect.any(Date) as Date },
    });
  });

  it("reuses cached access tokens until they expire", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      clientId: "client-id",
      clientSecretEnc: encryptSecret("client-secret"),
      refreshTokenEnc: encryptSecret("refresh-token"),
    });
    mockRefreshSpotifyAccessToken.mockResolvedValue({
      access_token: "access-token",
      token_type: "Bearer",
      scope: "user-read-currently-playing",
      expires_in: 3600,
    });

    await expect(getSpotifyAccessTokenForUser("user-1")).resolves.toBe(
      "access-token",
    );
    await expect(getSpotifyAccessTokenForUser("user-1")).resolves.toBe(
      "access-token",
    );

    expect(mockRefreshSpotifyAccessToken).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent refresh attempts for the same user", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      clientId: "client-id",
      clientSecretEnc: encryptSecret("client-secret"),
      refreshTokenEnc: encryptSecret("refresh-token"),
    });
    mockRefreshSpotifyAccessToken.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                access_token: "access-token",
                token_type: "Bearer",
                scope: "user-read-currently-playing",
                expires_in: 3600,
              }),
            20,
          );
        }),
    );

    const [first, second, third] = await Promise.all([
      getSpotifyAccessTokenForUser("user-1"),
      getSpotifyAccessTokenForUser("user-1"),
      getSpotifyAccessTokenForUser("user-1"),
    ]);

    expect(first).toBe("access-token");
    expect(second).toBe("access-token");
    expect(third).toBe("access-token");
    expect(mockRefreshSpotifyAccessToken).toHaveBeenCalledTimes(1);
  });

  it("refreshes again when forceRefresh is requested", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      clientId: "client-id",
      clientSecretEnc: encryptSecret("client-secret"),
      refreshTokenEnc: encryptSecret("refresh-token"),
    });
    mockRefreshSpotifyAccessToken.mockResolvedValue({
      access_token: "access-token",
      token_type: "Bearer",
      scope: "user-read-currently-playing",
      expires_in: 3600,
    });

    await getSpotifyAccessTokenForUser("user-1");
    await getSpotifyAccessTokenForUser("user-1", { forceRefresh: true });

    expect(mockRefreshSpotifyAccessToken).toHaveBeenCalledTimes(2);
  });
});
