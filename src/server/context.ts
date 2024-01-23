import { PrismaClient } from "@prisma/client";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

/* eslint-disable-next-line import/no-mutable-exports */
let prisma: PrismaClient | null;

export async function createContext(opts?: CreateNextContextOptions) {
  // check if we are running in production mode
  if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
  } else if (!prisma) {
    prisma = new PrismaClient();
  }

  return {
    prisma,
    req: opts?.req,
  };
}

export { prisma };
export type Context = inferAsyncReturnType<typeof createContext>;
