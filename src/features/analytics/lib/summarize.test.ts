import { summarizeAnalyticsRows } from "./summarize";

describe("summarizeAnalyticsRows", () => {
  it("aggregates pageviews, visits, countries, and paths", () => {
    const summary = summarizeAnalyticsRows([
      {
        path: "/",
        country: "NL",
        referrerHost: "linkedin.com",
        pageviews: 4,
        visits: 2,
      },
      {
        path: "/",
        country: "ES",
        referrerHost: "direct",
        pageviews: 1,
        visits: 1,
      },
      {
        path: "/projects/eleven",
        country: "NL",
        referrerHost: "google.com",
        pageviews: 3,
        visits: 1,
      },
    ]);

    expect(summary.pageviews).toBe(8);
    expect(summary.visits).toBe(4);
    expect(summary.countryCount).toBe(2);
    expect(summary.topPath).toBe("/");
    expect(summary.countries[0]).toEqual({ key: "NL", pageviews: 7 });
    expect(summary.paths.map((item) => item.key)).toEqual([
      "/",
      "/projects/eleven",
    ]);
    expect(summary.referrers.map((item) => item.key)).toEqual([
      "linkedin.com",
      "google.com",
    ]);
  });
});
