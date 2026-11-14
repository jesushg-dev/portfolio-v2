import "server-only";

import { db } from "@/server/db";
import { skillSlugFromTitle } from "@/utils/tools/skill-slug";
import { getPrimaryPublicTenant } from "./tenant";

export async function publicProjectParams() {
  const tenant = await getPrimaryPublicTenant();
  if (!tenant) return [];
  const projects = await db.project.findMany({
    where: {
      userId: tenant.userId,
      caseStudyEnabled: true,
      isPrivate: false,
      slug: { not: null },
    },
    select: { slug: true },
  });
  return projects.flatMap(({ slug }) => (slug?.trim() ? [{ slug }] : []));
}

export async function publicSkillParams() {
  const tenant = await getPrimaryPublicTenant();
  if (!tenant) return [];
  const skills = await db.skill.findMany({
    where: { userId: tenant.userId },
    select: { title: true },
  });
  return skills.map(({ title }) => ({ slug: skillSlugFromTitle(title) }));
}

export async function publicProcessParams() {
  const tenant = await getPrimaryPublicTenant();
  if (!tenant) {
    return [{ slug: "how-i-use-ai" }, { slug: "qa-collaboration" }];
  }
  const pages = await db.processPage.findMany({
    where: { userId: tenant.userId, isPublished: true },
    select: { slug: true },
  });
  const results = pages.flatMap(({ slug }) =>
    slug?.trim() ? [{ slug: slug.trim() }] : [],
  );
  if (results.length > 0) return results;
  return [{ slug: "how-i-use-ai" }, { slug: "qa-collaboration" }];
}

export async function publicBlogParams() {
  const tenant = await getPrimaryPublicTenant();
  if (!tenant) return [];
  const posts = await db.blogPost.findMany({
    where: { userId: tenant.userId, status: "PUBLISHED" },
    select: { slug: true },
  });
  return posts.flatMap(({ slug }) => (slug?.trim() ? [{ slug }] : []));
}

export async function publicBlogSeriesParams() {
  const tenant = await getPrimaryPublicTenant();
  if (!tenant) return [];
  const seriesList = await db.blogSeries.findMany({
    where: { userId: tenant.userId },
    select: { slug: true },
  });
  return seriesList.map(({ slug }) => ({ series: slug }));
}

export async function publicBlogTagParams() {
  const tenant = await getPrimaryPublicTenant();
  if (!tenant) return [];
  const posts = await db.blogPost.findMany({
    where: { userId: tenant.userId, status: "PUBLISHED" },
    select: { tags: true },
  });
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tag.toLowerCase().startsWith("series:")) {
        tags.add(tag);
      }
    }
  }
  return Array.from(tags).map((tag) => ({ tag }));
}
