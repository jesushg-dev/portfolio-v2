import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";

import type { LocaleMap } from "./lib/localized-text-seed";

interface NowFocusSeed {
  order: number;
  label: LocaleMap;
  body: LocaleMap;
}

interface PortfolioNowSeed {
  settings: {
    timezone: string;
    githubUsername: string;
    statusEmoji: string;
    statusSchedule: {
      startMinute: number;
      endMinute: number;
      weekdays: number[];
      emoji: string;
      body: LocaleMap;
    }[];
    readingCoverUrl: string;
    watchedCoverUrl: string;
    readingTitle: string;
    readingAuthors: string;
    readingProgress: number;
    watchedTitle: string;
    watchedRating: number;
    photoUrls: string[];
    statusBody: LocaleMap;
    statusRelative: LocaleMap;
  };
  focuses: NowFocusSeed[];
}

const portfolioNow = JSON.parse(
  readFileSync(new URL("./data/portfolio-now.json", import.meta.url), "utf8"),
) as PortfolioNowSeed;

export async function seedPortfolioNow(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const data = portfolioNow;
  console.log("[seed-portfolio-now] seeding settings + focuses...");

  await prisma.nowFocus.deleteMany({ where: { userId } });
  await prisma.nowSettings.deleteMany({ where: { userId } });

  const languages = await prisma.appLanguage.findMany();
  const s = data.settings;

  await prisma.nowSettings.create({
    data: {
      userId,
      timezone: s.timezone,
      githubUsername: s.githubUsername,
      statusEmoji: s.statusEmoji,
      statusSchedule: {
        create: s.statusSchedule.map((slot) => ({
          startMinute: slot.startMinute,
          endMinute: slot.endMinute,
          weekdays: slot.weekdays,
          emoji: slot.emoji,
          translations: {
            create: languages.map((language) => ({
              appLanguageId: language.id,
              body:
                slot.body[language.code as keyof LocaleMap] ??
                slot.body.en ??
                "",
            })),
          },
        })),
      },
      readingCoverUrl: s.readingCoverUrl || null,
      watchedCoverUrl: s.watchedCoverUrl || null,
      readingTitle: s.readingTitle,
      readingAuthors: s.readingAuthors,
      readingProgress: s.readingProgress,
      watchedTitle: s.watchedTitle,
      watchedRating: s.watchedRating,
      photoUrls: s.photoUrls,
      NowSettingsTranslation: {
        create: languages.map((lang) => {
          const code = lang.code as keyof LocaleMap;
          return {
            appLanguageId: lang.id,
            statusBody: s.statusBody[code] ?? s.statusBody.es ?? "",
            statusRelative: s.statusRelative[code] ?? s.statusRelative.es ?? "",
          };
        }),
      },
    },
  });

  for (const focus of data.focuses) {
    await prisma.nowFocus.create({
      data: {
        userId,
        order: focus.order,
        NowFocusTranslation: {
          create: languages.map((lang) => {
            const code = lang.code as keyof LocaleMap;
            return {
              appLanguageId: lang.id,
              label: focus.label[code] ?? focus.label.es ?? "",
              body: focus.body[code] ?? focus.body.es ?? "",
            };
          }),
        },
      },
    });
  }

  console.log(`[seed-portfolio-now] done. focuses=${data.focuses.length}`);
}

export { portfolioNow };
