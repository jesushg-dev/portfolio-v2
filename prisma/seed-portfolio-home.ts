import { readFileSync } from "node:fs";
import type { Prisma, PrismaClient } from "@prisma/client";

import { toLocalizedText } from "./lib/localized-text-seed";

type LocaleCode = "es" | "en" | "nl";
type LocaleMap = Partial<Record<LocaleCode, string>>;

interface TerminalStepSeed {
  command: LocaleMap;
  output: LocaleMap;
}

interface PortfolioHomeSeed {
  backgroundImageUrl: string;
  heroSummary: LocaleMap;
  heroTitles: LocaleMap[];
  terminal: {
    username: string;
    typingSpeed: number;
    delayBetweenCommands: number;
    steps: TerminalStepSeed[];
  };
}

const LOCALE_CODES: LocaleCode[] = ["es", "en", "nl"];

const portfolioHome = JSON.parse(
  readFileSync(new URL("./data/portfolio-home.json", import.meta.url), "utf8"),
) as PortfolioHomeSeed;

function asJson(
  value: ReturnType<typeof toLocalizedText>,
): Prisma.InputJsonValue {
  return value;
}

export async function seedPortfolioHome(
  prisma: PrismaClient,
  userId: string,
  langIds: Record<LocaleCode, string>,
): Promise<void> {
  const data = portfolioHome;
  console.log("[seed-portfolio-home] seeding hero, about terminal...");

  await prisma.cvHeader.update({
    where: { userId },
    data: {
      backgroundImageUrl: data.backgroundImageUrl,
      heroSummary: asJson(toLocalizedText(data.heroSummary)),
    },
  });

  await prisma.cvHeroTitle.deleteMany({ where: { userId } });
  for (const [index, title] of data.heroTitles.entries()) {
    await prisma.cvHeroTitle.create({
      data: {
        userId,
        order: index,
        translations: {
          create: LOCALE_CODES.map((code) => ({
            appLanguageId: langIds[code],
            text: title[code] ?? title.es ?? "",
          })),
        },
      },
    });
  }

  const terminal = await prisma.cvTerminal.upsert({
    where: { userId },
    create: {
      userId,
      username: data.terminal.username,
      typingSpeed: data.terminal.typingSpeed,
      delayBetweenCommands: data.terminal.delayBetweenCommands,
    },
    update: {
      username: data.terminal.username,
      typingSpeed: data.terminal.typingSpeed,
      delayBetweenCommands: data.terminal.delayBetweenCommands,
    },
  });

  await prisma.cvTerminalStep.deleteMany({
    where: { terminalId: terminal.id },
  });
  for (const [index, step] of data.terminal.steps.entries()) {
    const commandDefault = toLocalizedText(step.command).default;
    const outputDefault = toLocalizedText(step.output).default;

    await prisma.cvTerminalStep.create({
      data: {
        terminalId: terminal.id,
        order: index,
        translations: {
          create: LOCALE_CODES.map((code) => ({
            appLanguageId: langIds[code],
            command: step.command[code] ?? commandDefault,
            output: step.output[code] ?? outputDefault,
          })),
        },
      },
    });
  }

  console.log(
    `[seed-portfolio-home] done. titles=${data.heroTitles.length} terminalSteps=${data.terminal.steps.length}`,
  );
}

export { portfolioHome };
