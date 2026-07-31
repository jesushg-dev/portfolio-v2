import type { MetadataRoute } from "next";

import {
  buildLocalizedSitemapEntry,
  PUBLIC_SITEMAP_CHANGE_FREQUENCY,
  PUBLIC_SITEMAP_PATHS,
  PUBLIC_SITEMAP_PRIORITIES,
} from "@/lib/seo/build-sitemap";
import { db } from "@/server/db";
import { skillSlugFromTitle } from "@/utils/tools/skill-slug";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const primaryProfile = await db.profile.findFirst({
    where: { isPrimary: true },
    select: { userId: true, updatedAt: true },
  });

  const staticEntries = PUBLIC_SITEMAP_PATHS.map((pathname) =>
    buildLocalizedSitemapEntry(pathname, {
      priority: PUBLIC_SITEMAP_PRIORITIES[pathname],
      changeFrequency: PUBLIC_SITEMAP_CHANGE_FREQUENCY[pathname],
      lastModified: primaryProfile?.updatedAt,
    }),
  );

  if (!primaryProfile) {
    return staticEntries;
  }

  const [projects, skills] = await Promise.all([
    db.project.findMany({
      where: {
        userId: primaryProfile.userId,
        caseStudyEnabled: true,
        slug: { not: null },
        isPrivate: false,
      },
      select: { slug: true, createdAt: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
    db.skill.findMany({
      where: { userId: primaryProfile.userId },
      select: { title: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const projectEntries = projects
    .filter((project): project is typeof project & { slug: string } =>
      Boolean(project.slug?.trim()),
    )
    .map((project) =>
      buildLocalizedSitemapEntry(
        {
          pathname: "/projects/[slug]",
          params: { slug: project.slug },
        },
        {
          lastModified: project.createdAt,
          changeFrequency: "monthly",
          priority: 0.7,
        },
      ),
    );

  const skillEntries = skills.map((skill) =>
    buildLocalizedSitemapEntry(
      {
        pathname: "/skills/[slug]",
        params: { slug: skillSlugFromTitle(skill.title) },
      },
      {
        lastModified: skill.createdAt,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ),
  );

  return [...staticEntries, ...projectEntries, ...skillEntries];
}
