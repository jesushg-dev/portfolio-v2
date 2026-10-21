import { TRPCError } from "@trpc/server";

import {
  assertCvEmailRateLimit,
  logCvEmailRequest,
} from "./rate-limit-cv-email";

describe("assertCvEmailRateLimit", () => {
  it("allows requests under both limits", async () => {
    const db = {
      cvPdfEmailLog: {
        count: jest.fn().mockResolvedValue(0),
      },
    };
    await expect(
      assertCvEmailRateLimit(db as never, "user-1", "ip", "a@b.com"),
    ).resolves.toBeUndefined();
  });

  it("rejects when the IP hourly limit is hit", async () => {
    const db = {
      cvPdfEmailLog: {
        count: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(0),
      },
    };
    await expect(
      assertCvEmailRateLimit(db as never, "user-1", "ip", "a@b.com"),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("rejects when the recipient daily limit is hit", async () => {
    const db = {
      cvPdfEmailLog: {
        count: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(5),
      },
    };
    await expect(
      assertCvEmailRateLimit(db as never, "user-1", "ip", "a@b.com"),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});

describe("logCvEmailRequest", () => {
  it("writes a log row", async () => {
    const create = jest.fn();
    await logCvEmailRequest({ cvPdfEmailLog: { create } } as never, {
      userId: "user-1",
      ipHash: "ip",
      recipientEmail: "a@b.com",
      locale: "en",
    });
    expect(create).toHaveBeenCalled();
  });
});
