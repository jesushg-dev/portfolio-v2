import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/portfolio-projects.json",
);

const portfolioProjects = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as PortfolioProjectSeed[];

export interface PortfolioProjectSeed {
  key: string;
  image: string;
  type: string;
  githubUrl: string;
  websiteUrl: string;
  isPrivate: boolean;
  translations: {
    locale: "es" | "en" | "nl";
    title: string;
    description: string;
  }[];
  skillKeys: string[];
}

export type PortfolioProjectFixture = PortfolioProjectSeed;

export { portfolioProjects };
