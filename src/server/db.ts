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
// newly generated delegates (e.g. cvTerminal) are available without a manual restart.
if (
  env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  !("cvTerminal" in globalForPrisma.prisma)
) {
  globalForPrisma.prisma = undefined;
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
