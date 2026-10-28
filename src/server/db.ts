import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

const createPrismaClient = (): PrismaClient =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Dev HMR can keep a stale Prisma client after schema changes — drop it so
// newly generated delegates (e.g. portfolioTerminal) are available without a manual restart.
if (
  env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  (!("portfolioTerminal" in globalForPrisma.prisma) ||
    !("processPage" in globalForPrisma.prisma) ||
    !("jobSearch" in globalForPrisma.prisma) ||
    !("applicationEmailEvent" in globalForPrisma.prisma) ||
    !("analyticsDailyStat" in globalForPrisma.prisma))
) {
  globalForPrisma.prisma = undefined;
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
