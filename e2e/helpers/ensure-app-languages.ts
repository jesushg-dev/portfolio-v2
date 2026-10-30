import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

import { CREDENTIAL_PROVIDER_ID } from "../../src/lib/auth-account-issuer";

const prisma = new PrismaClient();

const APP_LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "en", name: "English" },
  { code: "nl", name: "Dutch" },
] as const;

/** Upsert shared AppLanguage rows required by admin translation forms. */
export async function ensureAppLanguages(): Promise<void> {
  for (const lang of APP_LANGUAGES) {
    await prisma.appLanguage.upsert({
      where: { code: lang.code },
      update: { name: lang.name },
      create: { code: lang.code, name: lang.name },
    });
  }
}

export async function syncE2eWorkerPassword(password: string): Promise<void> {
  const hashedPassword = await hashPassword(password);
  const e2eUsers = await prisma.user.findMany({
    where: {
      OR: [{ email: { contains: "-e2e-" } }, { email: { contains: "-e2e" } }],
    },
    select: { id: true },
  });

  if (e2eUsers.length > 0) {
    const userIds = e2eUsers.map((u) => u.id);
    await prisma.account.updateMany({
      where: {
        userId: { in: userIds },
        providerId: CREDENTIAL_PROVIDER_ID,
      },
      data: { password: hashedPassword },
    });
  }
}

export async function disconnectE2ePrisma(): Promise<void> {
  await prisma.$disconnect();
}

/** Prepare only the requested worker's persisted fixtures before visiting admin. */
export async function ensureWorkerJobSearch(email: string): Promise<void> {
  if (!/-e2e-\d+@/.test(email)) {
    throw new Error(
      "JobSearch fixture preparation requires an E2E worker email",
    );
  }
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return; // A new worker is registered through the UI afterwards.
  await prisma.$transaction(async (tx) => {
    const unassigned = {
      userId: user.id,
      OR: [{ jobSearchId: null }, { jobSearchId: { isSet: false } }],
    };
    const first = await tx.application.findFirst({
      where: unassigned,
      orderBy: { appliedDate: "asc" },
      select: { appliedDate: true },
    });
    if (!first) return;
    const searches = await tx.jobSearch.findMany({
      where: { userId: user.id, status: "OPEN" },
      take: 2,
    });
    if (searches.length > 1)
      throw new Error(`E2E worker ${email} has multiple open job searches`);
    const search =
      searches[0] ??
      (await tx.jobSearch.create({
        data: {
          userId: user.id,
          name: "E2E job search",
          status: "OPEN",
          startedAt: first.appliedDate,
        },
      }));
    await tx.application.updateMany({
      where: unassigned,
      data: { jobSearchId: search.id },
    });
  });
}
