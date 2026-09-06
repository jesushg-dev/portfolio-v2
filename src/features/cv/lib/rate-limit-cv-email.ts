import "server-only";

import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

import {
  getClientIpFromHeaders,
  hashClientIp,
} from "@/lib/http/client-ip";

export { getClientIpFromHeaders, hashClientIp };

const IP_HOURLY_LIMIT = 3;
const RECIPIENT_DAILY_LIMIT = 5;

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
