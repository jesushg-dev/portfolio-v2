import "server-only";

import { unstable_cache } from "next/cache";
import { db } from "@/server/db";
import { publicPortfolioTag } from "@/lib/public-site/cache-tags";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";
import { buildPortfolioSitemap } from "./portfolio-sitemap";
import type { MetadataRoute } from "next";

export async function getSeoTenant(scope: string) {
  if (!scope.startsWith("tenant-")) return null;
  const profile = await db.profile.findUnique({
    where: { username: scope.slice("tenant-".length) },
    select: {
      userId: true,
      username: true,
      isPrimary: true,
      isPublished: true,
      customDomain: true,
      updatedAt: true,
    },
  });
  if (!profile?.isPublished) return null;
  return { profile, origin: getTenantPublicUrl(profile) };
}

export async function getTenantSitemap(
  tenant: NonNullable<Awaited<ReturnType<typeof getSeoTenant>>>,
) {
  const { profile, origin } = tenant;
  return unstable_cache(
    () => buildPortfolioSitemap(profile, origin),
    ["tenant-sitemap", profile.userId, origin, profile.updatedAt.toISOString()],
    { tags: [publicPortfolioTag(profile.userId)], revalidate: 7200 },
  )();
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    switch (character) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

export function serializeSitemap(entries: MetadataRoute.Sitemap): string {
  const urls = entries.map((entry) => {
    const lastModified =
      entry.lastModified instanceof Date
        ? entry.lastModified.toISOString()
        : entry.lastModified;
    const alternates = Object.entries(entry.alternates?.languages ?? {})
      .flatMap(([language, url]) =>
        url
          ? [
              `<xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(url)}"/>`,
            ]
          : [],
      )
      .join("");
    return `<url><loc>${escapeXml(entry.url)}</loc>${alternates}${lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ""}${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ""}${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ""}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`;
}
