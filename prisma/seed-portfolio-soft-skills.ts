import { readFileSync } from "node:fs";
import type { PrismaClient, SoftSkillsMediaType } from "@prisma/client";

import type { LocaleMap } from "./lib/localized-text-seed";

interface SoftSkillItemSeed {
  icon: string;
  order: number;
  featured?: boolean;
  title: LocaleMap;
  description: LocaleMap;
  badge?: LocaleMap;
}

interface PortfolioSoftSkillsSeed {
  section: {
    mediaType: SoftSkillsMediaType;
    videoUrl: string | null;
    posterUrl: string | null;
    imageUrl: string | null;
  };
  items: SoftSkillItemSeed[];
}

const portfolioSoftSkills = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-soft-skills.json", import.meta.url),
    "utf8",
  ),
) as PortfolioSoftSkillsSeed;

export async function seedPortfolioSoftSkills(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const data = portfolioSoftSkills;
  console.log("[seed-portfolio-soft-skills] seeding section + items...");

  await prisma.portfolioSoftSkill.deleteMany({ where: { userId } });
  await prisma.softSkillsSection.deleteMany({ where: { userId } });

  const languages = await prisma.appLanguage.findMany();

  await prisma.softSkillsSection.create({
    data: {
      userId,
      mediaType: data.section.mediaType,
      videoUrl: data.section.videoUrl,
      posterUrl: data.section.posterUrl,
      imageUrl: data.section.imageUrl,
    },
  });

  for (const item of data.items) {
    await prisma.portfolioSoftSkill.create({
      data: {
        userId,
        icon: item.icon,
        order: item.order,
        isVisible: true,
        featured: item.featured ?? false,
        PortfolioSoftSkillTranslation: {
          create: languages.map((lang) => ({
            appLanguageId: lang.id,
            title:
              item.title[lang.code as keyof LocaleMap] ?? item.title.es ?? "",
            description:
              item.description[lang.code as keyof LocaleMap] ??
              item.description.es ??
              "",
            badge: item.badge
              ? (item.badge[lang.code as keyof LocaleMap] ??
                item.badge.es ??
                "")
              : "",
          })),
        },
      },
    });
  }

  console.log(`[seed-portfolio-soft-skills] done. items=${data.items.length}`);
}

export { portfolioSoftSkills };
