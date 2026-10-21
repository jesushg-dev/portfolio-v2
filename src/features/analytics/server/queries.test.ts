import { getAnalyticsSummary } from "./queries";

jest.mock("@/server/db", () => ({
  db: {
    analyticsDailyStat: {
      findMany: jest.fn(),
    },
  },
}));

import { db } from "@/server/db";

describe("getAnalyticsSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an empty summary when there are no rows", async () => {
    (db.analyticsDailyStat.findMany as jest.Mock).mockResolvedValue([]);
    const summary = await getAnalyticsSummary("user-1");
    expect(summary.pageviews).toBe(0);
    expect(summary.topPath).toBeNull();
  });

  it("summarizes rows and can hide referrers", async () => {
    (db.analyticsDailyStat.findMany as jest.Mock).mockResolvedValue([
      {
        path: "/",
        country: "NL",
        referrerHost: "github.com",
        pageviews: 4,
        visits: 2,
      },
    ]);

    const withoutReferrers = await getAnalyticsSummary("user-1", {
      includeReferrers: false,
    });
    expect(withoutReferrers.pageviews).toBe(4);
    expect(withoutReferrers.referrers).toEqual([]);

    const withReferrers = await getAnalyticsSummary("user-1", {
      days: 7,
      includeReferrers: true,
    });
    expect(withReferrers.referrers[0]?.key).toBe("github.com");
  });
});
