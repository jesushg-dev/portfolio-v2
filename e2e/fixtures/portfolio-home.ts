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

export const portfolioHome = (() => {
  const data = JSON.parse(readFileSync(fixturePath, "utf8")) as Partial<PortfolioHomeFixture> & {
    heroSubtitle?: LocalizedFixture;
  };
  return {
    ...data,
    heroTitles: data.heroTitles ?? (data.heroSubtitle ? [data.heroSubtitle] : []),
  } as PortfolioHomeFixture;
})();
