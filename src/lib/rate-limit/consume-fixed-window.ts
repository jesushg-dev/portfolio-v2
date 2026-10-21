import type { PrismaClient } from "@prisma/client";

type RateLimitDb = Pick<PrismaClient, "rateLimit">;

/**
 * Shared fixed-window counter stored in Better Auth's RateLimit collection
 * with an `app:` key prefix so it never collides with auth routes.
 */
export async function consumeFixedWindowLimit(
  db: RateLimitDb,
  input: { key: string; windowMs: number; max: number },
): Promise<boolean> {
  const key = `app:${input.key}`;
  const now = Date.now();
  const existing = await db.rateLimit.findUnique({ where: { key } });
  const last = existing ? Number(existing.lastRequest) : 0;
  const windowExpired = !existing || now - last > input.windowMs;

  if (windowExpired) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return true;
  }

  if (existing.count >= input.max) return false;

  await db.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 }, lastRequest: BigInt(now) },
  });
  return true;
}
