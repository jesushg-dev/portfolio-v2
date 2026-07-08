import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/portfolio-home.json",
);

export type LocalizedFixture = {
  es: string;
  en: string;
  nl: string;
};

export type PortfolioHomeTerminalStepFixture = {
  command: LocalizedFixture;
  output: LocalizedFixture;
};

export type PortfolioHomeFixture = {
  backgroundImageUrl: string;
  heroSummary: LocalizedFixture;
  heroTitles: LocalizedFixture[];
  terminal: {
    username: string;
    typingSpeed: number;
    delayBetweenCommands: number;
    steps: PortfolioHomeTerminalStepFixture[];
  };
};

export const portfolioHome = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as PortfolioHomeFixture;
