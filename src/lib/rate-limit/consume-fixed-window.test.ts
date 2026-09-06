import { consumeFixedWindowLimit } from "./consume-fixed-window";

function mockDb(existing: { count: number; lastRequest: bigint } | null) {
  return {
    rateLimit: {
      findUnique: jest.fn().mockResolvedValue(
        existing
          ? { key: "app:test", count: existing.count, lastRequest: existing.lastRequest }
          : null,
      ),
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

describe("consumeFixedWindowLimit", () => {
  it("allows the first request and starts a window", async () => {
    const db = mockDb(null);
    await expect(
      consumeFixedWindowLimit(db as never, {
        key: "test",
        windowMs: 60_000,
        max: 3,
      }),
    ).resolves.toBe(true);
    expect(db.rateLimit.upsert).toHaveBeenCalled();
  });

  it("rejects when the count is already at max inside the window", async () => {
    const db = mockDb({ count: 3, lastRequest: BigInt(Date.now()) });
    await expect(
      consumeFixedWindowLimit(db as never, {
        key: "test",
        windowMs: 60_000,
        max: 3,
      }),
    ).resolves.toBe(false);
    expect(db.rateLimit.update).not.toHaveBeenCalled();
  });

  it("resets after the window elapses", async () => {
    const db = mockDb({
      count: 3,
      lastRequest: BigInt(Date.now() - 120_000),
    });
    await expect(
      consumeFixedWindowLimit(db as never, {
        key: "test",
        windowMs: 60_000,
        max: 3,
      }),
    ).resolves.toBe(true);
    expect(db.rateLimit.upsert).toHaveBeenCalled();
  });
});
