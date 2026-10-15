import { readFileSync } from "node:fs";
import type { PrismaClient, StackType, TimelineCategory } from "@prisma/client";

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
  technologies?: string[];
  roles?: {
    title: string;
    startDate: string;
    endDate?: string;
  }[];
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

const portfolioSkills = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-skills.json", import.meta.url),
    "utf8",
  ),
) as { title: string; image: string; type: StackType }[];

export async function seedPortfolioTimeline(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const data = portfolioTimeline;
  console.log(
    "[seed-portfolio-timeline] seeding timeline items with connected skills...",
  );

  await prisma.timelineItemSkill.deleteMany({});
  await prisma.timelineItem.deleteMany({ where: { userId } });

  const languages = await prisma.appLanguage.findMany();

  // Ensure skills exist in DB for userId
  for (const s of portfolioSkills) {
    await prisma.skill.upsert({
      where: {
        userId_title: {
          userId,
          title: s.title,
        },
      },
      update: {
        image: s.image,
        type: s.type,
      },
      create: {
        userId,
        title: s.title,
        image: s.image,
        type: s.type,
      },
    });
  }

  const allSkills = await prisma.skill.findMany({
    where: { userId },
    select: { id: true, title: true },
  });
  const skillMap = new Map<string, string>();
  for (const s of allSkills) {
    skillMap.set(s.title.toLowerCase(), s.id);
  }

  if (skillMap.has("html5")) skillMap.set("html", skillMap.get("html5")!);
  if (skillMap.has("css3")) skillMap.set("css", skillMap.get("css3")!);

  for (const item of data.items) {
    const matchedSkillIds: string[] = [];
    for (const tech of item.technologies ?? []) {
      const id = skillMap.get(tech.toLowerCase());
      if (id) {
        matchedSkillIds.push(id);
      }
    }

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
        technologies: item.technologies ?? [],
        roles: item.roles ?? [],
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
        TimelineItemSkill: {
          create: matchedSkillIds.map((skillId) => ({
            skillId,
          })),
        },
      },
    });
  }

  console.log(`[seed-portfolio-timeline] done. items=${data.items.length}`);
}

export { portfolioTimeline };
