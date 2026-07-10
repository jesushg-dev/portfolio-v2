import { PrismaClient } from "@prisma/client";

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

export async function disconnectE2ePrisma(): Promise<void> {
  await prisma.$disconnect();
}
