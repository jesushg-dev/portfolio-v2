import {
  assertNonEmptyUserId,
  getAuthenticatedUserId,
  requireAuthenticatedUserId,
} from "./get-authenticated-user-id";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("next-intl/server", () => ({
  getLocale: jest.fn().mockResolvedValue("en"),
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth-redirect", () => ({
  redirectToLogin: jest.fn(() => {
    throw new Error("REDIRECT_TO_LOGIN");
  }),
}));

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";

describe("assertNonEmptyUserId", () => {
  it("accepts a non-empty string", () => {
    expect(() => assertNonEmptyUserId("user-123")).not.toThrow();
  });

  it("throws when userId is null", () => {
    expect(() => assertNonEmptyUserId(null)).toThrow(
      "Unauthorized: userId is required",
    );
  });

  it("throws when userId is an empty string", () => {
    expect(() => assertNonEmptyUserId("")).toThrow(
      "Unauthorized: userId is required",
    );
  });
});

describe("getAuthenticatedUserId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (headers as jest.Mock).mockResolvedValue(new Headers());
  });

  it("returns null when there is no session", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);
    await expect(getAuthenticatedUserId()).resolves.toBeNull();
  });

  it("returns null when session user id is missing", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    await expect(getAuthenticatedUserId()).resolves.toBeNull();
  });

  it("returns the user id when present", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { id: "user-123" },
    });
    await expect(getAuthenticatedUserId()).resolves.toBe("user-123");
  });
});

describe("requireAuthenticatedUserId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (headers as jest.Mock).mockResolvedValue(new Headers());
  });

  it("redirects to login when user id is missing", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);

    await expect(requireAuthenticatedUserId()).rejects.toThrow(
      "REDIRECT_TO_LOGIN",
    );
    expect(redirectToLogin).toHaveBeenCalledWith("en");
  });

  it("returns the user id when authenticated", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { id: "user-123" },
    });

    await expect(requireAuthenticatedUserId()).resolves.toBe("user-123");
  });
});
