/**
 * Read-only inventory of the `Account` collection for the Better Auth 1.7
 * account-identity migration (`(providerId, accountId)` -> `(issuer, accountId)`).
 *
 * Prints distinct provider ids, rows still missing `issuer`, and any
 * `(providerId, accountId)` / `(issuer, accountId)` collisions that would make
 * the unique index fail. Exits 1 when the database is not ready for
 * `pnpm db:push` with the 1.7 schema.
 *
 * Usage: pnpm db:auth-audit
 */
import "../lib/seed-env";
import { PrismaClient, type Prisma } from "@prisma/client";

import { resolveAccountIssuer } from "../../src/lib/auth-account-issuer";

interface AggregateCursorResult<T> {
  cursor?: { firstBatch?: T[] };
}

interface ProviderGroup {
  _id: string;
  total: number;
  missingIssuer: number;
}

interface CollisionGroup {
  _id: { a: string; b: string };
  count: number;
  users: number;
}

async function aggregate<T>(
  prisma: PrismaClient,
  pipeline: Prisma.InputJsonObject[],
): Promise<T[]> {
  const result = (await prisma.$runCommandRaw({
    aggregate: "Account",
    pipeline,
    cursor: {},
  })) as AggregateCursorResult<T>;
  return result.cursor?.firstBatch ?? [];
}

export async function auditAccountIdentity(
  prisma: PrismaClient,
): Promise<{ ready: boolean }> {
  const providers = await aggregate<ProviderGroup>(prisma, [
    {
      $group: {
        _id: "$providerId",
        total: { $sum: 1 },
        missingIssuer: {
          $sum: { $cond: [{ $eq: [{ $type: "$issuer" }, "missing"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  console.log("[auth-audit] providers:");
  for (const provider of providers) {
    console.log(
      `  - ${provider._id}: ${provider.total} account(s), ${provider.missingIssuer} missing issuer -> planned issuer "${resolveAccountIssuer(provider._id)}"`,
    );
  }

  const providerCollisions = await aggregate<CollisionGroup>(prisma, [
    {
      $group: {
        _id: { a: "$providerId", b: "$accountId" },
        count: { $sum: 1 },
        users: { $addToSet: "$userId" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $project: { count: 1, users: { $size: "$users" } } },
  ]);

  const issuerCollisions = await aggregate<CollisionGroup>(prisma, [
    { $match: { issuer: { $type: "string" } } },
    {
      $group: {
        _id: { a: "$issuer", b: "$accountId" },
        count: { $sum: 1 },
        users: { $addToSet: "$userId" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $project: { count: 1, users: { $size: "$users" } } },
  ]);

  const missing = providers.reduce((sum, p) => sum + p.missingIssuer, 0);

  for (const collision of providerCollisions) {
    console.error(
      `[auth-audit] COLLISION (providerId, accountId)=(${collision._id.a}, ${collision._id.b}) x${collision.count} across ${collision.users} user(s)`,
    );
  }
  for (const collision of issuerCollisions) {
    console.error(
      `[auth-audit] COLLISION (issuer, accountId)=(${collision._id.a}, ${collision._id.b}) x${collision.count} across ${collision.users} user(s)`,
    );
  }

  const ready =
    missing === 0 &&
    providerCollisions.length === 0 &&
    issuerCollisions.length === 0;

  console.log(
    `[auth-audit] accounts missing issuer: ${missing}; collisions: ${providerCollisions.length + issuerCollisions.length}`,
  );
  console.log(
    ready
      ? "[auth-audit] READY: the 1.7 schema (unique issuer+accountId) can be pushed."
      : missing > 0 && providerCollisions.length === 0
        ? "[auth-audit] BLOCKED: run `pnpm db:auth-backfill` first."
        : "[auth-audit] BLOCKED: resolve the collisions above before continuing.",
  );

  return { ready };
}

if (process.argv[1]?.endsWith("audit-account-identity.ts")) {
  const prisma = new PrismaClient();
  auditAccountIdentity(prisma)
    .then(({ ready }) => {
      process.exitCode = ready ? 0 : 1;
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
