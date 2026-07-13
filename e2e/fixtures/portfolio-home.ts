import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/portfolio-home.json",
);

export interface LocalizedFixture {
  es: string;
  en: string;
  nl: string;
}

export interface PortfolioHomeTerminalStepFixture {
  command: LocalizedFixture;
  output: LocalizedFixture;
}

export interface PortfolioHomeFixture {
  backgroundImageUrl: string;
  heroSummary: LocalizedFixture;
  heroTitles: LocalizedFixture[];
  terminal: {
    username: string;
    typingSpeed: number;
    delayBetweenCommands: number;
    steps: PortfolioHomeTerminalStepFixture[];
  };
}

export const portfolioHome = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as PortfolioHomeFixture;
