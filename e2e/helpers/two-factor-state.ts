import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Leave a test account without a second factor so the spec can start from a
 * known state even if a previous run died half-way through enabling 2FA.
 */
export async function resetTwoFactorForEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return;

  await prisma.twoFactor.deleteMany({ where: { userId: user.id } });
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false },
  });
}

export async function disconnectTwoFactorPrisma(): Promise<void> {
  await prisma.$disconnect();
}
