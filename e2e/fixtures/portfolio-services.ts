import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/portfolio-services.json",
);

export interface PortfolioServiceSeed {
  key: string;
  type: string;
  image: string;
  translations: {
    locale: "es" | "en" | "nl";
    title: string;
    description: string;
  }[];
}

export type PortfolioServiceFixture = PortfolioServiceSeed;

const portfolioServices = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as PortfolioServiceSeed[];

export { portfolioServices };
