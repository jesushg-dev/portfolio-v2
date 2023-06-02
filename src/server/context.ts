import { PrismaClient } from '@prisma/client';

import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

let prisma: PrismaClient | null = null;

export async function createContext(opts?: CreateNextContextOptions) {
  //check if we are running in production mode
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    //check if there is already a connection to the database
    if (!prisma) {
      prisma = new PrismaClient();
    }
  }

  return {
    prisma,
    req: opts?.req,
  };
}

export { prisma };
export type Context = inferAsyncReturnType<typeof createContext>;
