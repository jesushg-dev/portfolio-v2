import type { MetadataRoute } from "next";

import {
  buildLocalizedSitemapEntries,
  INDEXABLE_SITEMAP_PATHS,
  PUBLIC_SITEMAP_CHANGE_FREQUENCY,
  PUBLIC_SITEMAP_PRIORITIES,
} from "@/lib/seo/build-sitemap";
import { db } from "@/server/db";
import { skillSlugFromTitle } from "@/utils/tools/skill-slug";

import "server-only";
import { SITE_URL } from "@/lib/seo/site";

export async function buildPortfolioSitemap(
  profile: { userId: string; updatedAt: Date } | null,
  origin = SITE_URL,
): Promise<MetadataRoute.Sitemap> {
  const staticEntries = INDEXABLE_SITEMAP_PATHS.flatMap((pathname) =>
    buildLocalizedSitemapEntries(pathname, {
      origin,
      priority: PUBLIC_SITEMAP_PRIORITIES[pathname],
      changeFrequency: PUBLIC_SITEMAP_CHANGE_FREQUENCY[pathname],
      lastModified: profile?.updatedAt,
    }),
  );

  if (!profile) {
    return staticEntries;
  }

  const [projects, skills, processPages] = await Promise.all([
    db.project.findMany({
      where: {
        userId: profile.userId,
        caseStudyEnabled: true,
        slug: { not: null },
        isPrivate: false,
      },
      select: { slug: true, createdAt: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
    db.skill.findMany({
      where: { userId: profile.userId },
      select: { title: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.processPage.findMany({
      where: {
        userId: profile.userId,
        isPublished: true,
      },
      select: { slug: true, updatedAt: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const projectEntries = projects
    .filter((project): project is typeof project & { slug: string } =>
      Boolean(project.slug?.trim()),
    )
    .flatMap((project) =>
      buildLocalizedSitemapEntries(
        {
          pathname: "/projects/[slug]",
          params: { slug: project.slug },
        },
        {
          origin,
          lastModified: project.createdAt,
          changeFrequency: "monthly",
          priority: 0.7,
        },
      ),
    );

  const skillEntries = skills.flatMap((skill) =>
    buildLocalizedSitemapEntries(
      {
        pathname: "/skills/[slug]",
        params: { slug: skillSlugFromTitle(skill.title) },
      },
      {
        origin,
        lastModified: skill.createdAt,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ),
  );

  const processPageEntries = processPages.flatMap((page) =>
    buildLocalizedSitemapEntries(
      {
        pathname: "/process/[slug]",
        params: { slug: page.slug },
      },
      {
        origin,
        lastModified: page.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ),
  );

  return [
    ...staticEntries,
    ...projectEntries,
    ...skillEntries,
    ...processPageEntries,
  ];
}
