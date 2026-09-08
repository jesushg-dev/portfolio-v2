/**
 * Better Auth 1.6 -> 1.7 account-identity backfill (Prisma + MongoDB has no
 * CLI-driven migration path, see "Upgrading to Better Auth 1.7").
 *
 * For every `Account` document without an `issuer`:
 *   - `credential`          -> issuer "local:credential", accountId = userId
 *   - any other providerId  -> issuer "local:oauth:<encodeURIComponent(providerId)>"
 *
 * Idempotent: rows that already carry an issuer are left untouched. Run this
 * BEFORE `pnpm db:push` with the 1.7 schema and BEFORE deploying the 1.7 app.
 *
 * Usage: pnpm db:auth-backfill
 */
import "../lib/seed-env";
import { PrismaClient, type Prisma } from "@prisma/client";

import {
  CREDENTIAL_PROVIDER_ID,
  resolveAccountIssuer,
} from "../../src/lib/auth-account-issuer";
import { auditAccountIdentity } from "./audit-account-identity";

interface DistinctResult {
  values?: string[];
}

interface UpdateResult {
  n?: number;
  nModified?: number;
}

const MISSING_ISSUER: Prisma.InputJsonObject = {
  $or: [{ issuer: { $exists: false } }, { issuer: null }],
};

async function runUpdate(
  prisma: PrismaClient,
  q: Prisma.InputJsonObject,
  u: Prisma.InputJsonObject | Prisma.InputJsonObject[],
): Promise<number> {
  const result = (await prisma.$runCommandRaw({
    update: "Account",
    updates: [{ q, u, multi: true }],
  })) as UpdateResult;
  return result.nModified ?? 0;
}

async function backfillAccountIssuer(prisma: PrismaClient): Promise<void> {
  const distinct = (await prisma.$runCommandRaw({
    distinct: "Account",
    key: "providerId",
    query: MISSING_ISSUER,
  })) as DistinctResult;
  const providerIds = distinct.values ?? [];

  if (providerIds.length === 0) {
    console.log(
      "[auth-backfill] nothing to do: every account already has an issuer.",
    );
    return;
  }

  // Credential accounts must use the stable user id as accountId (Better Auth 1.7).
  const normalizedCredentialIds = await runUpdate(
    prisma,
    {
      providerId: CREDENTIAL_PROVIDER_ID,
      $expr: { $ne: ["$accountId", { $toString: "$userId" }] },
    },
    [{ $set: { accountId: { $toString: "$userId" } } }],
  );
  if (normalizedCredentialIds > 0) {
    console.log(
      `[auth-backfill] normalized accountId=userId on ${normalizedCredentialIds} credential account(s)`,
    );
  }

  for (const providerId of providerIds) {
    const issuer = resolveAccountIssuer(providerId);
    const modified = await runUpdate(
      prisma,
      { providerId, ...MISSING_ISSUER },
      { $set: { issuer } },
    );
    console.log(
      `[auth-backfill] providerId="${providerId}" -> issuer="${issuer}": ${modified} account(s) updated`,
    );
  }
}

const prisma = new PrismaClient();

backfillAccountIssuer(prisma)
  .then(() => auditAccountIdentity(prisma))
  .then(({ ready }) => {
    process.exitCode = ready ? 0 : 1;
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
