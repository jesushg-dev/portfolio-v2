import {
  CREDENTIAL_ACCOUNT_ISSUER,
  createOAuthAccountIssuer,
  resolveAccountIssuer,
} from "./auth-account-issuer";

describe("resolveAccountIssuer", () => {
  it("maps credential accounts to the local credential namespace", () => {
    expect(resolveAccountIssuer("credential")).toBe("local:credential");
    expect(resolveAccountIssuer("credential")).toBe(CREDENTIAL_ACCOUNT_ISSUER);
  });

  it("maps social providers to the synthetic OAuth namespace", () => {
    expect(resolveAccountIssuer("google")).toBe("local:oauth:google");
    expect(resolveAccountIssuer("github")).toBe("local:oauth:github");
  });

  it("percent-encodes provider ids exactly like Better Auth", () => {
    expect(createOAuthAccountIssuer("team/github")).toBe(
      "local:oauth:team%2Fgithub",
    );
    expect(resolveAccountIssuer("team/github")).toBe(
      "local:oauth:team%2Fgithub",
    );
  });
});
