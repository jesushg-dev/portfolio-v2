import { readFileSync } from "node:fs";
import type { PrismaClient, UsesItemType } from "@prisma/client";

import type { LocaleMap } from "./lib/localized-text-seed";

interface UsesItemSeed {
  type: UsesItemType;
  href: string;
  image: string | null;
  order: number;
  title: LocaleMap;
  description?: LocaleMap;
}

interface UsesClarificationSeed {
  order: number;
  body: LocaleMap;
}

interface PortfolioUsesSeed {
  settings: {
    workspaceImage: string;
    codingPreviewLight: string;
    codingPreviewDark: string;
    codingIntro: LocaleMap;
    browserIntro: LocaleMap;
    clarifications: UsesClarificationSeed[];
  };
  items: UsesItemSeed[];
}

const portfolioUses = JSON.parse(
  readFileSync(new URL("./data/portfolio-uses.json", import.meta.url), "utf8"),
) as PortfolioUsesSeed;

function localeValue(map: LocaleMap, code: string): string {
  return map[code as keyof LocaleMap] ?? map.es ?? map.en ?? "";
}

export async function seedPortfolioUses(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const data = portfolioUses;
  console.log("[seed-portfolio-uses] seeding settings + items...");

  await prisma.usesItem.deleteMany({ where: { userId } });

  const existingSettings = await prisma.usesSettings.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existingSettings) {
    await prisma.usesClarificationTranslation.deleteMany({
      where: { UsesClarification: { usesSettingsId: existingSettings.id } },
    });
    await prisma.usesClarification.deleteMany({
      where: { usesSettingsId: existingSettings.id },
    });
    await prisma.usesSettingsTranslation.deleteMany({
      where: { usesSettingsId: existingSettings.id },
    });
    await prisma.usesSettings.delete({ where: { id: existingSettings.id } });
  }

  const languages = await prisma.appLanguage.findMany();
  const s = data.settings;

  const settings = await prisma.usesSettings.create({
    data: {
      userId,
      workspaceImage: s.workspaceImage,
      codingPreviewLight: s.codingPreviewLight,
      codingPreviewDark: s.codingPreviewDark,
      UsesSettingsTranslation: {
        create: languages.map((lang) => ({
          appLanguageId: lang.id,
          codingIntro: localeValue(s.codingIntro, lang.code),
          browserIntro: localeValue(s.browserIntro, lang.code),
        })),
      },
    },
  });

  for (const clarification of s.clarifications) {
    await prisma.usesClarification.create({
      data: {
        usesSettingsId: settings.id,
        order: clarification.order,
        UsesClarificationTranslation: {
          create: languages.map((lang) => ({
            appLanguageId: lang.id,
            body: localeValue(clarification.body, lang.code),
          })),
        },
      },
    });
  }

  for (const item of data.items) {
    await prisma.usesItem.create({
      data: {
        userId,
        type: item.type,
        href: item.href,
        image: item.image,
        order: item.order,
        UsesItemTranslation: {
          create: languages.map((lang) => ({
            appLanguageId: lang.id,
            title: localeValue(item.title, lang.code),
            description: item.description
              ? localeValue(item.description, lang.code) || null
              : null,
          })),
        },
      },
    });
  }

  console.log(
    `[seed-portfolio-uses] done. items=${data.items.length} clarifications=${s.clarifications.length}`,
  );
}

export { portfolioUses };
