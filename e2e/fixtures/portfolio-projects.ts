import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/projects",
);

const portfolioProjects = readdirSync(projectsDir)
  .filter((file) => file.endsWith(".json"))
  .map(
    (file) =>
      JSON.parse(
        readFileSync(join(projectsDir, file), "utf8"),
      ) as PortfolioProjectSeed,
  )
  .sort(
    (a, b) =>
      ((a as { order?: number }).order ?? 999) -
      ((b as { order?: number }).order ?? 999),
  );

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
