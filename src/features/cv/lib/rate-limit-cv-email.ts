import "server-only";

import { createHash } from "node:crypto";

import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

const IP_HOURLY_LIMIT = 3;
const RECIPIENT_DAILY_LIMIT = 5;

export function hashClientIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip")?.trim() ?? "unknown";
}

export async function assertCvEmailRateLimit(
  db: PrismaClient,
  userId: string,
  ipHash: string,
  recipientEmail: string,
): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [ipCount, recipientCount] = await Promise.all([
    db.cvPdfEmailLog.count({
      where: {
        userId,
        ipHash,
        createdAt: { gte: oneHourAgo },
      },
    }),
    db.cvPdfEmailLog.count({
      where: {
        userId,
        recipientEmail,
        createdAt: { gte: oneDayAgo },
      },
    }),
  ]);

  if (ipCount >= IP_HOURLY_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "CV email rate limit exceeded for this IP",
    });
  }

  if (recipientCount >= RECIPIENT_DAILY_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "CV email rate limit exceeded for this recipient",
    });
  }
}

export async function logCvEmailRequest(
  db: PrismaClient,
  input: {
    userId: string;
    ipHash: string;
    recipientEmail: string;
    locale: string;
  },
): Promise<void> {
  await db.cvPdfEmailLog.create({
    data: input,
  });
}
