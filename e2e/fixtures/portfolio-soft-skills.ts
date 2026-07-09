import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export type SoftSkillLocale = "es" | "en" | "nl";

export type PortfolioSoftSkillItemFixture = {
  icon: string;
  order: number;
  title: Record<SoftSkillLocale, string>;
  description: Record<SoftSkillLocale, string>;
};

export type PortfolioSoftSkillsFixture = {
  section: {
    mediaType: "VIDEO" | "IMAGE";
    videoUrl: string | null;
    posterUrl: string | null;
    imageUrl: string | null;
  };
  items: PortfolioSoftSkillItemFixture[];
};

const fixtureDir = dirname(fileURLToPath(import.meta.url));

export const portfolioSoftSkills = JSON.parse(
  readFileSync(
    join(fixtureDir, "../../prisma/data/portfolio-soft-skills.json"),
    "utf8",
  ),
) as PortfolioSoftSkillsFixture;
