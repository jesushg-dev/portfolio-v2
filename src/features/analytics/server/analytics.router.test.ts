import { analyticsRouter } from "./analytics.router";
import { analyticsAdminRouter } from "./analytics-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
} from "@/test-utils/trpc-caller";

jest.mock("./queries", () => ({
  getAnalyticsSummary: jest.fn(),
}));

import { getAnalyticsSummary } from "./queries";

const summary = {
  pageviews: 10,
  visits: 4,
  countryCount: 1,
  topPath: "/",
  countries: [],
  paths: [],
  referrers: [{ key: "github.com", pageviews: 3 }],
};

describe("analyticsRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAnalyticsSummary as jest.Mock).mockResolvedValue(summary);
  });

  it("returns an empty summary without a tenant", async () => {
    const caller = createRouterCaller(
      analyticsRouter,
      createTrpcTestContext({ db: {}, tenant: null }),
    );
    const result = await caller.getPublicSummary();
    expect(result.pageviews).toBe(0);
    expect(getAnalyticsSummary).not.toHaveBeenCalled();
  });

  it("loads the public summary for a tenant", async () => {
    const caller = createRouterCaller(
      analyticsRouter,
      createTrpcTestContext({ db: {} }),
    );
    const result = await caller.getPublicSummary({ days: 14 });
    expect(result.pageviews).toBe(10);
    expect(getAnalyticsSummary).toHaveBeenCalledWith("user-1", {
      days: 14,
      includeReferrers: false,
    });
  });
});

describe("analyticsAdminRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAnalyticsSummary as jest.Mock).mockResolvedValue(summary);
  });

  it("rejects unauthenticated callers", async () => {
    const caller = createRouterCaller(
      analyticsAdminRouter,
      createTrpcTestContext({ db: {}, user: null }),
    );
    await expect(caller.getDashboard()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("includes referrers for the dashboard", async () => {
    const caller = createRouterCaller(
      analyticsAdminRouter,
      createTrpcTestContext({ db: {} }),
    );
    const result = await caller.getDashboard({ days: 30 });
    expect(result.referrers).toHaveLength(1);
    expect(getAnalyticsSummary).toHaveBeenCalledWith("user-1", {
      days: 30,
      includeReferrers: true,
    });
  });
});
