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

interface UsesWorkspaceTagSeed {
  itemHref: string;
  xPercent: number;
  yPercent: number;
}

interface PortfolioUsesSeed {
  settings: {
    workspaceImage: string;
    codingPreviewLight: string;
    codingPreviewDark: string;
    codingIntro: LocaleMap;
    browserIntro: LocaleMap;
    clarifications: UsesClarificationSeed[];
    workspaceTags?: UsesWorkspaceTagSeed[];
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

  const existingSettings = await prisma.usesSettings.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existingSettings) {
    await prisma.usesWorkspaceTag.deleteMany({
      where: { usesSettingsId: existingSettings.id },
    });
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

  await prisma.usesItem.deleteMany({ where: { userId } });

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

  const hrefToItemId = new Map<string, string>();

  for (const item of data.items) {
    const created = await prisma.usesItem.create({
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
    hrefToItemId.set(item.href, created.id);
  }

  for (const [index, tag] of (s.workspaceTags ?? []).entries()) {
    const usesItemId = hrefToItemId.get(tag.itemHref);
    if (!usesItemId) continue;
    await prisma.usesWorkspaceTag.create({
      data: {
        usesSettingsId: settings.id,
        usesItemId,
        xPercent: tag.xPercent,
        yPercent: tag.yPercent,
        order: index,
      },
    });
  }

  console.log(
    `[seed-portfolio-uses] done. items=${data.items.length} clarifications=${s.clarifications.length} tags=${s.workspaceTags?.length ?? 0}`,
  );
}

export { portfolioUses };
