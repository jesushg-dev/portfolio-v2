import { getInternalServiceBaseUrl, getServerBaseUrl } from "./get-base-url";

describe("getServerBaseUrl", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("prefers BETTER_AUTH_URL without a trailing slash", () => {
    process.env.BETTER_AUTH_URL = "https://jesushg.com/";
    delete process.env.VERCEL_URL;
    expect(getServerBaseUrl()).toBe("https://jesushg.com");
  });

  it("uses VERCEL_URL when Better Auth URL is missing", () => {
    delete process.env.BETTER_AUTH_URL;
    process.env.VERCEL_URL = "portfolio.vercel.app";
    expect(getServerBaseUrl()).toBe("https://portfolio.vercel.app");
  });

  it("falls back to localhost", () => {
    delete process.env.BETTER_AUTH_URL;
    delete process.env.VERCEL_URL;
    process.env.PORT = "4000";
    expect(getServerBaseUrl()).toBe("http://localhost:4000");
  });
});

describe("getInternalServiceBaseUrl", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("uses 127.0.0.1 locally", () => {
    delete process.env.VERCEL;
    process.env.PORT = "3000";
    expect(getInternalServiceBaseUrl()).toBe("http://127.0.0.1:3000");
  });

  it("uses the public server URL on Vercel", () => {
    process.env.VERCEL = "1";
    process.env.BETTER_AUTH_URL = "https://jesushg.com";
    expect(getInternalServiceBaseUrl()).toBe("https://jesushg.com");
  });
});
