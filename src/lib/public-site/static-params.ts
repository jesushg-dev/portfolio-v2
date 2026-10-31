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
  if (!tenant) return [];
  return db.processPage.findMany({
    where: { userId: tenant.userId, isPublished: true },
    select: { slug: true },
  });
}
