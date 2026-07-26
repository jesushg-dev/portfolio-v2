import { TRPCError } from "@trpc/server";

import {
  assertCvEmailRateLimit,
  getClientIpFromHeaders,
  hashClientIp,
  logCvEmailRequest,
} from "./rate-limit-cv-email";

// ── hashClientIp ─────────────────────────────────────────────────────────────

describe("hashClientIp", () => {
  it("returns a 32-character hex string", () => {
    const hash = hashClientIp("127.0.0.1");
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

// ── getClientIpFromHeaders ────────────────────────────────────────────────────

describe("getClientIpFromHeaders", () => {
  it("returns the first IP from x-forwarded-for when present", () => {
    const headers = new Headers({ "x-forwarded-for": "192.168.1.1, 10.0.0.1" });
    expect(getClientIpFromHeaders(headers)).toBe("192.168.1.1");
  });

  it("returns x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "10.0.0.2" });
    expect(getClientIpFromHeaders(headers)).toBe("10.0.0.2");
  });

  it("returns 'unknown' when no IP header is present", () => {
    const headers = new Headers();
    expect(getClientIpFromHeaders(headers)).toBe("unknown");
  });

  it("skips x-forwarded-for when its first part is empty and falls back to x-real-ip", () => {
    // A malformed forwarded header whose first segment is empty (after trim).
    const headers = new Headers({
      "x-forwarded-for": "  ,10.0.0.3",
      "x-real-ip": "10.0.0.4",
    });
    // The first entry trims to "" which is falsy, so we fall through to x-real-ip.
    expect(getClientIpFromHeaders(headers)).toBe("10.0.0.4");
  });
});

// ── assertCvEmailRateLimit ────────────────────────────────────────────────────

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

  it("throws when the daily recipient limit is exceeded", async () => {
    const db = {
      cvPdfEmailLog: {
        count: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(5),
      },
    };

    await expect(
      assertCvEmailRateLimit(db as never, "user-1", "some-hash", "recruiter@company.com"),
    ).rejects.toThrow(TRPCError);
  });

  it("does not throw when both counts are below limits", async () => {
    const db = {
      cvPdfEmailLog: {
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2),
      },
    };

    await expect(
      assertCvEmailRateLimit(db as never, "user-1", "some-hash", "recruiter@company.com"),
    ).resolves.toBeUndefined();
  });
});

// ── logCvEmailRequest ─────────────────────────────────────────────────────────

describe("logCvEmailRequest", () => {
  it("calls db.cvPdfEmailLog.create with the provided input", async () => {
    const createMock = jest.fn().mockResolvedValue({});
    const db = { cvPdfEmailLog: { create: createMock } };

    await logCvEmailRequest(db as never, {
      userId: "user-1",
      ipHash: "hash",
      recipientEmail: "test@example.com",
      locale: "en",
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        ipHash: "hash",
        recipientEmail: "test@example.com",
        locale: "en",
      },
    });
  });
});
