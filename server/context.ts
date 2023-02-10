import { PrismaClient } from '@prisma/client';

import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

export async function createContext(opts?: CreateNextContextOptions) {
  const prisma = new PrismaClient();
  return { prisma };
}

export type Context = inferAsyncReturnType<typeof createContext>;
