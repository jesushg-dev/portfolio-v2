jest.mock("@/env", () => ({
  env: {
    PRIMARY_DOMAIN: "jesushg.com",
  },
}));

import {
  appendPortfolioWebsiteContact,
  formatWebsiteDisplayValue,
  normalizeWebsiteUrl,
  PORTFOLIO_WEBSITE_CONTACT_ID,
} from "@/lib/cv/append-portfolio-website-contact";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";

describe("getTenantPublicUrl", () => {
  it("returns SITE_URL for the primary tenant", () => {
    expect(
      getTenantPublicUrl({
        username: "jesus",
        isPrimary: true,
        customDomain: null,
      }),
    ).toBe("https://www.jesushg.com");
  });

  it("returns a subdomain URL for secondary tenants", () => {
    expect(
      getTenantPublicUrl({
        username: "maria",
        isPrimary: false,
        customDomain: null,
      }),
    ).toBe("https://maria.jesushg.com");
  });

  it("prefers a custom domain when configured", () => {
    expect(
      getTenantPublicUrl({
        username: "maria",
        isPrimary: false,
        customDomain: "https://maria.dev",
      }),
    ).toBe("https://maria.dev");
  });
});

describe("appendPortfolioWebsiteContact", () => {
  it("appends the portfolio website when it is missing", () => {
    const contacts = appendPortfolioWebsiteContact(
      [{ type: "EMAIL", value: "hello@example.com", order: 0 }],
      "https://www.jesushg.com",
    );

    expect(contacts).toHaveLength(2);
    expect(contacts[1]).toMatchObject({
      id: PORTFOLIO_WEBSITE_CONTACT_ID,
      type: "WEBSITE",
      value: "https://www.jesushg.com",
      label: { default: "jesushg.com" },
    });
  });

  it("does not duplicate an existing website contact", () => {
    const contacts = appendPortfolioWebsiteContact(
      [
        {
          type: "WEBSITE",
          value: "https://www.jesushg.com/",
          order: 1,
        },
      ],
      "https://www.jesushg.com",
    );

    expect(contacts).toHaveLength(1);
  });
});

describe("normalizeWebsiteUrl", () => {
  it("normalizes equivalent website URLs", () => {
    expect(normalizeWebsiteUrl("https://www.jesushg.com/")).toBe(
      "https://www.jesushg.com",
    );
    expect(normalizeWebsiteUrl("jesushg.com")).toBe("https://jesushg.com");
  });
});

describe("formatWebsiteDisplayValue", () => {
  it("shows a compact hostname for CV contact rows", () => {
    expect(formatWebsiteDisplayValue("https://www.jesushg.com/")).toBe(
      "jesushg.com",
    );
  });
});
