import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import superjson from "superjson";
import { db } from "@/server/db";
import {
  publicPortfolioTag,
  PRIMARY_PORTFOLIO_TAG,
} from "@/lib/public-site/cache-tags";
import { resolveUserTechnicalSkills } from "./resolve-user-technical-skills";

function loadCvPageData(userId: string) {
  return Promise.all([
    db.appLanguage.findMany(),
    db.profile.findUnique({ where: { userId } }),
    db.cvHeader.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    db.cvAboutMe.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    db.cvContact.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.cvEducation.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.cvLanguage.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    resolveUserTechnicalSkills(db, userId),
    db.cvExperience.findMany({
      where: { userId },
      include: {
        translations: true,
        responsibilities: {
          include: { translations: true },
          orderBy: { order: "asc" },
        },
        CvExperienceSkill: { include: { skill: true } },
      },
      orderBy: { order: "asc" },
    }),
    db.cvSoftSkill.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.cvAdditionalInfo.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.cvPersonalReference.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
  ]);
}

export const getPublicCvPageData = cache(
  async (userId: string, fresh = false) => {
    if (fresh) return loadCvPageData(userId);
    const serialized = await unstable_cache(
      async () => superjson.stringify(await loadCvPageData(userId)),
      ["public-cv-page-data", userId],
      {
        tags: [publicPortfolioTag(userId), PRIMARY_PORTFOLIO_TAG],
        revalidate: 7200,
      },
    )();
    return superjson.parse<Awaited<ReturnType<typeof loadCvPageData>>>(
      serialized,
    );
  },
);
