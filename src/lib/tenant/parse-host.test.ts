import { parseTenantSlug, requestHostFromHeaders } from "./parse-host";

const primary = "jesushg.com";

describe("parseTenantSlug", () => {
  it("returns null for apex, localhost, and reserved subdomains", () => {
    expect(parseTenantSlug("jesushg.com", primary)).toBeNull();
    expect(parseTenantSlug("www.jesushg.com", primary)).toBeNull();
    expect(parseTenantSlug("localhost:3000", primary)).toBeNull();
    expect(parseTenantSlug("lvh.me", primary)).toBeNull();
    expect(parseTenantSlug("admin.jesushg.com", primary)).toBeNull();
  });

  it("parses tenant subdomains including *.localhost", () => {
    expect(parseTenantSlug("jesus.jesushg.com", primary)).toBe("jesus");
    expect(parseTenantSlug("lola.localhost:3000", primary)).toBe("lola");
    expect(parseTenantSlug("lola.lvh.me:3000", primary)).toBe("lola");
  });
});

describe("requestHostFromHeaders", () => {
  it("prefers the first x-forwarded-host value", () => {
    const headers = new Headers({
      "x-forwarded-host": "lola.localhost:3000, jesushg.com",
      host: "localhost:3000",
    });
    expect(requestHostFromHeaders(headers)).toBe("lola.localhost:3000");
  });
});
