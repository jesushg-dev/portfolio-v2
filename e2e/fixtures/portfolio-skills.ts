import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/portfolio-skills.json",
);

const portfolioSkills = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as PortfolioSkillSeed[];

export interface PortfolioSkillSeed {
  key: string;
  title: string;
  type: string;
  image: string;
  translations: {
    locale: "es" | "en" | "nl";
    description: string;
    urlWiki: string;
  }[];
}

export type PortfolioSkillFixture = PortfolioSkillSeed;

export { portfolioSkills };
