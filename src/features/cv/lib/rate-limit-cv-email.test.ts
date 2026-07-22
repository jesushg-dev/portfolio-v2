import { TRPCError } from "@trpc/server";

import { assertCvEmailRateLimit, hashClientIp } from "./rate-limit-cv-email";

describe("assertCvEmailRateLimit", () => {
  it("throws when the hourly IP limit is exceeded", async () => {
    const db = {
      cvPdfEmailLog: {
        count: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(0),
      },
    };

    await expect(
      assertCvEmailRateLimit(
        db as never,
        "user-1",
        hashClientIp("127.0.0.1"),
        "recruiter@company.com",
      ),
    ).rejects.toThrow(TRPCError);
  });
});
