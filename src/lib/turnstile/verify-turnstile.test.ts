import { verifyTurnstileToken } from "./verify-turnstile";

describe("verifyTurnstileToken", () => {
  const originalEnv = process.env;

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("passes in test environment when TURNSTILE_SECRET is not set", async () => {
    delete process.env.TURNSTILE_SECRET;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "test",
      configurable: true,
      writable: true,
    });

    const result = await verifyTurnstileToken({
      token: "dummy-token",
      expectedAction: "contact",
    });

    expect(result.success).toBe(true);
  });

  it("rejects when secret is missing in non-test environment", async () => {
    delete process.env.TURNSTILE_SECRET;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
      writable: true,
    });

    const result = await verifyTurnstileToken({
      token: "dummy-token",
      expectedAction: "contact",
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("missing_secret");
  });

  it("rejects when token is empty", async () => {
    process.env.TURNSTILE_SECRET = "test-secret";
    process.env.TURNSTILE_HOSTNAMES = "localhost";

    const result = await verifyTurnstileToken({
      token: "",
      expectedAction: "contact",
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid_token_or_hostnames");
  });

  it("succeeds when Cloudflare siteverify validates the token, action, and hostname", async () => {
    process.env.TURNSTILE_SECRET = "test-secret";
    process.env.TURNSTILE_HOSTNAMES = "localhost,jesushg.com";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        action: "contact",
        hostname: "jesushg.com",
      }),
    });

    const result = await verifyTurnstileToken({
      token: "valid-token",
      expectedAction: "contact",
      clientIp: "127.0.0.1",
    });

    expect(result.success).toBe(true);
  });

  it("rejects when siteverify returns wrong action or hostname mismatch", async () => {
    process.env.TURNSTILE_SECRET = "test-secret";
    process.env.TURNSTILE_HOSTNAMES = "jesushg.com";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        action: "login",
        hostname: "evil.com",
      }),
    });

    const result = await verifyTurnstileToken({
      token: "valid-token",
      expectedAction: "contact",
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("verification_rejected");
  });

  it("succeeds when client hostname has www prefix but allowed hostname does not", async () => {
    process.env.TURNSTILE_SECRET = "test-secret";
    process.env.TURNSTILE_HOSTNAMES = "jesushg.com";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        action: "contact",
        hostname: "www.jesushg.com",
      }),
    });

    const result = await verifyTurnstileToken({
      token: "valid-token",
      expectedAction: "contact",
    });

    expect(result.success).toBe(true);
  });

  it("succeeds in production by default when hostname is www.jesushg.com", async () => {
    process.env.TURNSTILE_SECRET = "test-secret";
    delete process.env.TURNSTILE_HOSTNAMES;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
      writable: true,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        action: "contact",
        hostname: "www.jesushg.com",
      }),
    });

    const result = await verifyTurnstileToken({
      token: "valid-token",
      expectedAction: "contact",
    });

    expect(result.success).toBe(true);
  });
});
