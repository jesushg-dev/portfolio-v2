import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export type TimelineLocale = "es" | "en" | "nl";

export type PortfolioTimelineItemFixture = {
  key: string;
  title: Record<TimelineLocale, string>;
  description: Record<TimelineLocale, string>;
  category: "WORK" | "STUDY" | "COURSE";
  organization: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  images?: string[];
};

export type PortfolioTimelineFixture = {
  items: PortfolioTimelineItemFixture[];
};

const fixtureDir = dirname(fileURLToPath(import.meta.url));

export const portfolioTimeline = JSON.parse(
  readFileSync(
    join(fixtureDir, "../../prisma/data/portfolio-timeline.json"),
    "utf8",
  ),
) as PortfolioTimelineFixture;
