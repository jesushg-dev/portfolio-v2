import { readFileSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "@prisma/client";

import { requireOwnerCredentials } from "./lib/seed-env";
import { CREDENTIAL_PROVIDER_ID } from "../src/lib/auth-account-issuer";

export interface PortfolioProfileSeed {
  name: string;
  username: string;
  displayName: string;
  logoInitials?: string;
  defaultLocale: "es" | "en" | "nl";
  photoUrl: string;
}

const portfolioProfile = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-profile.json", import.meta.url),
    "utf8",
  ),
) as PortfolioProfileSeed;

export interface SeedPortfolioUserResult {
  userId: string;
}

export async function seedPortfolioUser(
  prisma: PrismaClient,
): Promise<SeedPortfolioUserResult> {
  const { email, password } = requireOwnerCredentials();
  const data = portfolioProfile;

  console.log("[seed-portfolio-user] creating primary owner...");

  const owner = await prisma.user.upsert({
    where: { email },
    update: { name: data.name, emailVerified: true },
    create: {
      name: data.name,
      email,
      emailVerified: true,
    },
  });

  await prisma.profile.updateMany({
    where: { isPrimary: true, userId: { not: owner.id } },
    data: { isPrimary: false },
  });

  await prisma.profile.upsert({
    where: { userId: owner.id },
    update: {
      isPrimary: true,
      isPublished: true,
      username: data.username,
      defaultLocale: data.defaultLocale,
      displayName: data.displayName,
      logoInitials: data.logoInitials ?? null,
    },
    create: {
      userId: owner.id,
      username: data.username,
      displayName: data.displayName,
      logoInitials: data.logoInitials ?? null,
      defaultLocale: data.defaultLocale,
      isPrimary: true,
      isPublished: true,
    },
  });

  const hashedPassword = await hashPassword(password);
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: owner.id,
      providerId: CREDENTIAL_PROVIDER_ID,
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        password: hashedPassword,
        accountId: owner.id,
      },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: owner.id,
        providerId: CREDENTIAL_PROVIDER_ID,
        accountId: owner.id,
        password: hashedPassword,
      },
    });
  }

  console.log(`[seed-portfolio-user] done. owner.id=${owner.id}`);
  return { userId: owner.id };
}

export { portfolioProfile };
