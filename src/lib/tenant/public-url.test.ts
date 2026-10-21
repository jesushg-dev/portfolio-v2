jest.mock("@/env", () => ({
  env: { PRIMARY_DOMAIN: "jesushg.com" },
}));

import { SITE_URL } from "@/lib/seo/site";

import { getTenantPublicUrl } from "./public-url";

describe("getTenantPublicUrl", () => {
  it("uses a custom domain as-is when it already has a protocol", () => {
    expect(
      getTenantPublicUrl({
        username: "ada",
        isPrimary: false,
        customDomain: "https://ada.dev/",
      }),
    ).toBe("https://ada.dev");
  });

  it("prefixes https for a bare custom domain", () => {
    expect(
      getTenantPublicUrl({
        username: "ada",
        isPrimary: false,
        customDomain: "ada.dev",
      }),
    ).toBe("https://ada.dev");
  });

  it("uses the apex site URL for the primary tenant", () => {
    expect(
      getTenantPublicUrl({
        username: "owner",
        isPrimary: true,
        customDomain: null,
      }),
    ).toBe(SITE_URL.replace(/\/$/, ""));
  });

  it("builds a subdomain URL for other tenants", () => {
    expect(
      getTenantPublicUrl({
        username: "ada",
        isPrimary: false,
        customDomain: null,
      }),
    ).toBe("https://ada.jesushg.com");
  });
});
