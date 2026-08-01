import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";

type LocaleCode = "es" | "en" | "nl";
type LocaleMap = Partial<Record<LocaleCode, string>>;

interface TerminalStepSeed {
  command: LocaleMap;
  output: LocaleMap;
}

interface PortfolioHomeSeed {
  backgroundImageUrl: string;
  heroSubtitle: LocaleMap;
  heroTagline: LocaleMap;
  heroSummary: LocaleMap;
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
    },
  });

  const header = await prisma.cvHeader.findUnique({ where: { userId } });
  if (header) {
    for (const code of LOCALE_CODES) {
      const appLanguageId = langIds[code];
      if (appLanguageId) {
        await prisma.cvHeaderTranslation.upsert({
          where: {
            cvHeaderId_appLanguageId: {
              cvHeaderId: header.id,
              appLanguageId,
            },
          },
          create: {
            cvHeaderId: header.id,
            appLanguageId,
            degree: "",
            heroSubtitle: data.heroSubtitle[code] ?? data.heroSubtitle.es ?? "",
            heroTagline: data.heroTagline[code] ?? data.heroTagline.es ?? "",
            heroSummary: data.heroSummary[code] ?? data.heroSummary.es ?? "",
          },
          update: {
            heroSubtitle: data.heroSubtitle[code] ?? data.heroSubtitle.es ?? "",
            heroTagline: data.heroTagline[code] ?? data.heroTagline.es ?? "",
            heroSummary: data.heroSummary[code] ?? data.heroSummary.es ?? "",
          },
        });
      }
    }
  }

  // Remove old titles if they existed
  await prisma.cvHeroTitle.deleteMany({ where: { userId } });

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
    const commandDefault = step.command.es ?? "";
    const outputDefault = step.output.es ?? "";

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
    `[seed-portfolio-home] done. terminalSteps=${data.terminal.steps.length}`,
  );
}

export { portfolioHome };
