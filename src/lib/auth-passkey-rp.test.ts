import { resolvePasskeyRelyingParty } from "./auth-passkey-rp";

describe("resolvePasskeyRelyingParty", () => {
  it("uses the primary domain in production so tenant subdomains share passkeys", () => {
    expect(
      resolvePasskeyRelyingParty({
        nodeEnv: "production",
        primaryDomain: "jesushg.com",
        devDomain: "lvh.me:3000",
      }),
    ).toEqual({ rpID: "jesushg.com", rpName: "Jehg" });
  });

  it("uses the dev domain host (without port) outside production", () => {
    expect(
      resolvePasskeyRelyingParty({
        nodeEnv: "development",
        primaryDomain: "jesushg.com",
        devDomain: "lvh.me:3000",
      }).rpID,
    ).toBe("lvh.me");

    expect(
      resolvePasskeyRelyingParty({
        nodeEnv: "test",
        primaryDomain: "jesushg.com",
        devDomain: "http://localhost:3000",
      }).rpID,
    ).toBe("localhost");
  });

  it("lets BETTER_AUTH_URL override everything", () => {
    expect(
      resolvePasskeyRelyingParty({
        nodeEnv: "production",
        primaryDomain: "jesushg.com",
        devDomain: "lvh.me:3000",
        betterAuthUrl: "https://preview.example.dev",
      }).rpID,
    ).toBe("preview.example.dev");
  });

  it("falls back to localhost for unparsable dev domains", () => {
    expect(
      resolvePasskeyRelyingParty({
        nodeEnv: "development",
        primaryDomain: "jesushg.com",
        devDomain: "http://",
      }).rpID,
    ).toBe("localhost");
  });
});
