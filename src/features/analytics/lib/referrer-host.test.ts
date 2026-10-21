import { referrerHostFromUrl, normalizeCountryCode } from "./referrer-host";

describe("referrerHostFromUrl", () => {
  it("treats empty and same-host referrers as direct", () => {
    expect(referrerHostFromUrl("")).toBe("direct");
    expect(referrerHostFromUrl("https://jehg.dev/about", "jehg.dev")).toBe(
      "direct",
    );
    expect(referrerHostFromUrl("https://www.jehg.dev/", "jehg.dev")).toBe(
      "direct",
    );
  });

  it("stores only the hostname", () => {
    expect(
      referrerHostFromUrl("https://www.linkedin.com/in/someone?trk=x"),
    ).toBe("linkedin.com");
    expect(referrerHostFromUrl("https://google.com/search?q=test")).toBe(
      "google.com",
    );
  });

  it("falls back to direct for invalid URLs", () => {
    expect(referrerHostFromUrl("not a url")).toBe("direct");
  });
});

describe("normalizeCountryCode", () => {
  it("keeps ISO country codes and falls back to XX", () => {
    expect(normalizeCountryCode("nl")).toBe("NL");
    expect(normalizeCountryCode("US")).toBe("US");
    expect(normalizeCountryCode("Netherlands")).toBe("XX");
    expect(normalizeCountryCode(null)).toBe("XX");
  });
});
