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
    json: () => Promise.resolve(body),
    headers: headerBag,
  } as unknown as Request;
}

describe("handleAnalyticsCollect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(db.profile, "findFirst").mockResolvedValue(profile as never);
    jest.spyOn(db.profile, "findUnique").mockResolvedValue(profile as never);
    jest.mocked(consumeFixedWindowLimit).mockResolvedValue(true);
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);
    jest.spyOn(db.analyticsDailyStat, "upsert").mockResolvedValue({} as never);
    jest.spyOn(Math, "random").mockReturnValue(0.9);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 204 for invalid JSON payloads", async () => {
    const upsertSpy = jest.spyOn(db.analyticsDailyStat, "upsert");
    const response = await handleAnalyticsCollect(
      collectRequest({ path: 123 }),
    );
    expect(response.status).toBe(204);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("returns 204 when no tenant profile exists", async () => {
    jest.spyOn(db.profile, "findFirst").mockResolvedValue(null);
    const upsertSpy = jest.spyOn(db.analyticsDailyStat, "upsert");
    const response = await handleAnalyticsCollect(
      collectRequest({ path: "/" }),
    );
    expect(response.status).toBe(204);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("returns 204 when the rate limit is exceeded", async () => {
    jest.mocked(consumeFixedWindowLimit).mockResolvedValue(false);
    const upsertSpy = jest.spyOn(db.analyticsDailyStat, "upsert");
    const response = await handleAnalyticsCollect(
      collectRequest({ path: "/" }),
    );
    expect(response.status).toBe(204);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("skips owner sessions", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { id: "user-1" },
    });
    const upsertSpy = jest.spyOn(db.analyticsDailyStat, "upsert");
    const response = await handleAnalyticsCollect(
      collectRequest({ path: "/" }),
    );
    expect(response.status).toBe(204);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("increments pageviews for a public visit", async () => {
    const upsertSpy = jest.spyOn(db.analyticsDailyStat, "upsert");
    const response = await handleAnalyticsCollect(
      collectRequest(
        { path: "/en/curriculum-vitae", isNewVisit: true, referrer: "" },
        { "x-vercel-ip-country": "NL" },
      ),
    );
    expect(response.status).toBe(204);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining<Record<string, unknown>>({
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
    jest
      .spyOn(db.analyticsDailyStat, "upsert")
      .mockRejectedValue(new Error("race"));
    const updateSpy = jest
      .spyOn(db.analyticsDailyStat, "update")
      .mockResolvedValue({} as never);
    await handleAnalyticsCollect(collectRequest({ path: "/" }));
    expect(updateSpy).toHaveBeenCalled();
  });

  it("prunes old stats on the rare path", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.01);
    const deleteSpy = jest
      .spyOn(db.analyticsDailyStat, "deleteMany")
      .mockResolvedValue({
        count: 2,
      });
    await handleAnalyticsCollect(collectRequest({ path: "/" }));
    expect(deleteSpy).toHaveBeenCalled();
  });

  it("fails open when rate-limit storage errors", async () => {
    jest.mocked(consumeFixedWindowLimit).mockRejectedValue(new Error("db"));
    const upsertSpy = jest.spyOn(db.analyticsDailyStat, "upsert");
    await handleAnalyticsCollect(collectRequest({ path: "/" }));
    expect(upsertSpy).toHaveBeenCalled();
  });
});
