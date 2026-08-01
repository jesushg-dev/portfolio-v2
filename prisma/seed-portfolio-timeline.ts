import { readFileSync } from "node:fs";
import type { PrismaClient, TimelineCategory } from "@prisma/client";

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

export async function seedPortfolioTimeline(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const data = portfolioTimeline;
  console.log("[seed-portfolio-timeline] seeding timeline items...");

  await prisma.timelineItem.deleteMany({ where: { userId } });

  const languages = await prisma.appLanguage.findMany();

  for (const item of data.items) {
    await prisma.timelineItem.create({
      data: {
        userId,
        category: item.category,
        organization: item.organization,
        location: item.location ?? null,
        startDate: new Date(item.startDate),
        endDate: item.endDate ? new Date(item.endDate) : null,
        current: item.current,
        images: item.images ?? [],
        TimelineItemTranslation: {
          create: languages.map((lang) => ({
            appLanguageId: lang.id,
            title: item.title[lang.code as LocaleCode] ?? item.title.es ?? "",
            description:
              item.description[lang.code as LocaleCode] ??
              item.description.es ??
              "",
          })),
        },
      },
    });
  }

  console.log(`[seed-portfolio-timeline] done. items=${data.items.length}`);
}

export { portfolioTimeline };
