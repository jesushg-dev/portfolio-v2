import { handleAnalyticsCollect } from "./collect";

jest.mock("@/server/db", () => ({
  db: {
    profile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    analyticsDailyStat: {
      upsert: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("@/lib/rate-limit/consume-fixed-window", () => ({
  consumeFixedWindowLimit: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { consumeFixedWindowLimit } from "@/lib/rate-limit/consume-fixed-window";
import { db } from "@/server/db";

const profile = { userId: "user-1", username: "owner" };

function collectRequest(
  body: unknown,
  headers?: Record<string, string>,
): Request {
  const headerBag = new Headers({
    "content-type": "application/json",
    host: "jesushg.com",
    "user-agent": "Mozilla/5.0",
    "x-vercel-forwarded-for": "203.0.113.10",
    ...headers,
  });

  return {
    json: async () => body,
    headers: headerBag,
  } as unknown as Request;
}

describe("handleAnalyticsCollect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.profile.findFirst as jest.Mock).mockResolvedValue(profile);
    (db.profile.findUnique as jest.Mock).mockResolvedValue(profile);
    (consumeFixedWindowLimit as jest.Mock).mockResolvedValue(true);
    (auth.api.getSession as jest.Mock).mockResolvedValue(null);
    (db.analyticsDailyStat.upsert as jest.Mock).mockResolvedValue({});
    jest.spyOn(Math, "random").mockReturnValue(0.9);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 204 for invalid JSON payloads", async () => {
    const response = await handleAnalyticsCollect(
      collectRequest({ path: 123 }),
    );
    expect(response.status).toBe(204);
    expect(db.analyticsDailyStat.upsert).not.toHaveBeenCalled();
  });

  it("returns 204 when no tenant profile exists", async () => {
    (db.profile.findFirst as jest.Mock).mockResolvedValue(null);
    const response = await handleAnalyticsCollect(
      collectRequest({ path: "/" }),
    );
    expect(response.status).toBe(204);
    expect(db.analyticsDailyStat.upsert).not.toHaveBeenCalled();
  });

  it("returns 204 when the rate limit is exceeded", async () => {
    (consumeFixedWindowLimit as jest.Mock).mockResolvedValue(false);
    const response = await handleAnalyticsCollect(
      collectRequest({ path: "/" }),
    );
    expect(response.status).toBe(204);
    expect(db.analyticsDailyStat.upsert).not.toHaveBeenCalled();
  });

  it("skips owner sessions", async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1" },
    });
    const response = await handleAnalyticsCollect(
      collectRequest({ path: "/" }),
    );
    expect(response.status).toBe(204);
    expect(db.analyticsDailyStat.upsert).not.toHaveBeenCalled();
  });

  it("increments pageviews for a public visit", async () => {
    const response = await handleAnalyticsCollect(
      collectRequest(
        { path: "/en/curriculum-vitae", isNewVisit: true, referrer: "" },
        { "x-vercel-ip-country": "NL" },
      ),
    );
    expect(response.status).toBe(204);
    expect(db.analyticsDailyStat.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: "user-1",
          path: "/curriculum-vitae",
          country: "NL",
          pageviews: 1,
          visits: 1,
        }),
      }),
    );
  });

  it("falls back to update when upsert throws", async () => {
    (db.analyticsDailyStat.upsert as jest.Mock).mockRejectedValue(
      new Error("race"),
    );
    (db.analyticsDailyStat.update as jest.Mock).mockResolvedValue({});
    await handleAnalyticsCollect(collectRequest({ path: "/" }));
    expect(db.analyticsDailyStat.update).toHaveBeenCalled();
  });

  it("prunes old stats on the rare path", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.01);
    (db.analyticsDailyStat.deleteMany as jest.Mock).mockResolvedValue({
      count: 2,
    });
    await handleAnalyticsCollect(collectRequest({ path: "/" }));
    expect(db.analyticsDailyStat.deleteMany).toHaveBeenCalled();
  });

  it("fails open when rate-limit storage errors", async () => {
    (consumeFixedWindowLimit as jest.Mock).mockRejectedValue(new Error("db"));
    await handleAnalyticsCollect(collectRequest({ path: "/" }));
    expect(db.analyticsDailyStat.upsert).toHaveBeenCalled();
  });
});
