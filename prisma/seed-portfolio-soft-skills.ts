import { readFileSync } from "node:fs";
import type { Prisma, PrismaClient, SoftSkillsMediaType } from "@prisma/client";

import { toLocalizedText, type LocaleMap } from "./lib/localized-text-seed";

interface SoftSkillItemSeed {
  icon: string;
  order: number;
  featured?: boolean;
  title: LocaleMap;
  description: LocaleMap;
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

function asJson(
  value: ReturnType<typeof toLocalizedText>,
): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export async function seedPortfolioSoftSkills(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const data = portfolioSoftSkills;
  console.log("[seed-portfolio-soft-skills] seeding section + items...");

  await prisma.portfolioSoftSkill.deleteMany({ where: { userId } });
  await prisma.softSkillsSection.deleteMany({ where: { userId } });

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
        title: asJson(toLocalizedText(item.title)),
        description: asJson(toLocalizedText(item.description)),
      },
    });
  }

  console.log(`[seed-portfolio-soft-skills] done. items=${data.items.length}`);
}

export { portfolioSoftSkills };
