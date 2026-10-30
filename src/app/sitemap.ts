import { unstable_cache } from "next/cache";
import { buildPortfolioSitemap } from "@/lib/seo/portfolio-sitemap";
import {
  PRIMARY_PORTFOLIO_TAG,
  publicPortfolioTag,
} from "@/lib/public-site/cache-tags";
import { db } from "@/server/db";

export const revalidate = 7200;

export default async function sitemap() {
  const profile = await db.profile.findFirst({
    where: { isPrimary: true },
    select: { userId: true, updatedAt: true },
  });
  if (!profile) return buildPortfolioSitemap(null);
  return unstable_cache(
    () => buildPortfolioSitemap(profile),
    ["primary-sitemap", profile.userId, profile.updatedAt.toISOString()],
    {
      tags: [PRIMARY_PORTFOLIO_TAG, publicPortfolioTag(profile.userId)],
      revalidate: 7200,
    },
  )();
}
