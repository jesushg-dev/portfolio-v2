import { readFileSync } from "node:fs";
import type { Prisma, PrismaClient, TimelineCategory } from "@prisma/client";

import { toLocalizedText } from "./lib/localized-text-seed";

type LocaleCode = "es" | "en" | "nl";
type LocaleMap = Partial<Record<LocaleCode, string>>;

interface TimelineItemSeed {
  key: string;
  title: LocaleMap;
  description: LocaleMap;
  category: TimelineCategory;
  organization: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  images?: string[];
}

interface PortfolioTimelineSeed {
  items: TimelineItemSeed[];
}

const portfolioTimeline = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-timeline.json", import.meta.url),
    "utf8",
  ),
) as PortfolioTimelineSeed;

function asJson(
  value: ReturnType<typeof toLocalizedText>,
): Prisma.InputJsonValue {
  return value;
}

export async function seedPortfolioTimeline(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const data = portfolioTimeline;
  console.log("[seed-portfolio-timeline] seeding timeline items...");

  await prisma.timelineItem.deleteMany({ where: { userId } });

  for (const item of data.items) {
    await prisma.timelineItem.create({
      data: {
        userId,
        title: asJson(toLocalizedText(item.title)),
        description: asJson(toLocalizedText(item.description)),
        category: item.category,
        organization: item.organization,
        location: item.location ?? null,
        startDate: new Date(item.startDate),
        endDate: item.endDate ? new Date(item.endDate) : null,
        current: item.current,
        images: item.images ?? [],
      },
    });
  }

  console.log(`[seed-portfolio-timeline] done. items=${data.items.length}`);
}

export { portfolioTimeline };
