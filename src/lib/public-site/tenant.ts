import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { site } from "next/root-params";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { profileToTenant } from "@/lib/tenant/profile-to-tenant";
import { PRIMARY_PORTFOLIO_TAG, publicPortfolioTag } from "./cache-tags";

const getPrimaryUserId = unstable_cache(
  async () => {
    const profile = await db.profile.findFirst({
      where: { isPrimary: true },
      select: { userId: true },
    });
    return profile?.userId ?? null;
  },
  ["public-primary-user"],
  { tags: [PRIMARY_PORTFOLIO_TAG], revalidate: 7200 },
);

export async function getPrimaryPublicTenant() {
  const cachedUserId = await getPrimaryUserId();
  const userId =
    cachedUserId ??
    (
      await db.profile.findFirst({
        where: { isPrimary: true },
        select: { userId: true },
      })
    )?.userId ??
    null;

  if (!userId) return null;

  const cachedProfile = await unstable_cache(
    () => db.profile.findUnique({ where: { userId } }),
    ["public-portfolio-profile", userId],
    { tags: [publicPortfolioTag(userId)], revalidate: 7200 },
  )();

  const profile =
    cachedProfile ?? (await db.profile.findUnique({ where: { userId } }));

  return profile ? profileToTenant(profile) : null;
}

export const resolvePublicTenant = cache(async () => {
  const scope = await site();
  if (scope === "primary") return getPrimaryPublicTenant();
  if (!scope?.startsWith("tenant-")) notFound();
  await connection();
  const profile = await db.profile.findUnique({
    where: { username: scope.slice("tenant-".length) },
  });
  return profile ? profileToTenant(profile) : null;
});
