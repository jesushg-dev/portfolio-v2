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
      OR: [
        { email: { contains: "-e2e-" } },
        { email: { contains: "-e2e" } },
      ],
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
