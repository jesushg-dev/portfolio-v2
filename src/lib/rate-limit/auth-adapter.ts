import { Prisma } from "@prisma/client";
import type { prismaAdapter } from "better-auth/adapters/prisma";

/** Retry the entire counter transaction, including its conditional read. */
export function withRateLimitRetry(
  factory: ReturnType<typeof prismaAdapter>,
): ReturnType<typeof prismaAdapter> {
  return (options) => {
    const adapter = factory(options);
    return {
      ...adapter,
      async incrementOne(input) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await adapter.incrementOne(input);
          } catch (error) {
            if (
              input.model !== "rateLimit" ||
              !(error instanceof Prisma.PrismaClientKnownRequestError) ||
              error.code !== "P2034" ||
              attempt >= 5
            ) {
              throw error;
            }
            // Jitter keeps competing requests from retrying in lockstep.
            await new Promise((resolve) =>
              setTimeout(resolve, 10 * 2 ** attempt + Math.random() * 10),
            );
          }
        }
      },
    };
  };
}
