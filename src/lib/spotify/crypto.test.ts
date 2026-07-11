import { decryptSecret, encryptSecret } from "./crypto";

jest.mock("@/env", () => ({
  env: { BETTER_AUTH_SECRET: "test-secret-for-spotify-encryption" },
}));

describe("spotify crypto", () => {
  it("round-trips encrypt and decrypt", () => {
    const original = "AQC_test_refresh_token_value";
    const encrypted = encryptSecret(original);

    expect(encrypted).not.toContain(original);
    expect(decryptSecret(encrypted)).toBe(original);
  });

  it("throws on invalid payload", () => {
    expect(() => decryptSecret("not-valid")).toThrow(
      "Invalid encrypted payload format",
    );
  });
});
