import { readFileSync } from "node:fs";
import type { PrismaClient, SoftSkillsMediaType } from "@prisma/client";

import type { LocaleMap } from "./lib/localized-text-seed";

interface SoftSkillMetricSeed {
  value: string;
  order: number;
  label: LocaleMap;
}

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
  metrics?: SoftSkillMetricSeed[];
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
  console.log(
    "[seed-portfolio-soft-skills] seeding section + metrics + items...",
  );

  await prisma.portfolioSoftSkill.deleteMany({ where: { userId } });
  await prisma.softSkillsMetric.deleteMany({
    where: { section: { userId } },
  });
  await prisma.softSkillsSection.deleteMany({ where: { userId } });

  const languages = await prisma.appLanguage.findMany();

  const section = await prisma.softSkillsSection.create({
    data: {
      userId,
      mediaType: data.section.mediaType,
      videoUrl: data.section.videoUrl,
      posterUrl: data.section.posterUrl,
      imageUrl: data.section.imageUrl,
    },
  });

  if (data.metrics && data.metrics.length > 0) {
    for (const metric of data.metrics) {
      await prisma.softSkillsMetric.create({
        data: {
          sectionId: section.id,
          value: metric.value,
          order: metric.order,
          SoftSkillsMetricTranslation: {
            create: languages.map((lang) => ({
              appLanguageId: lang.id,
              label:
                metric.label[lang.code as keyof LocaleMap] ??
                metric.label.es ??
                "",
            })),
          },
        },
      });
    }
  }

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
