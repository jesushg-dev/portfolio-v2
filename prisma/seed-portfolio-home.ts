import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";
import { portfolioProfile } from "./seed-portfolio-user";

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
  about: LocaleMap;
  availabilityBadge?: LocaleMap;
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

  await prisma.portfolioHeader.upsert({
    where: { userId },
    create: {
      userId,
      fullName: portfolioProfile.name,
      photoUrl: portfolioProfile.photoUrl,
      backgroundImageUrl: data.backgroundImageUrl,
    },
    update: { backgroundImageUrl: data.backgroundImageUrl },
  });

  const header = await prisma.portfolioHeader.findUnique({ where: { userId } });
  if (header) {
    for (const code of LOCALE_CODES) {
      const appLanguageId = langIds[code];
      if (appLanguageId) {
        await prisma.portfolioHeaderTranslation.upsert({
          where: {
            portfolioHeaderId_appLanguageId: {
              portfolioHeaderId: header.id,
              appLanguageId,
            },
          },
          create: {
            portfolioHeaderId: header.id,
            appLanguageId,

            heroSubtitle:
              data.heroSubtitle?.[code] ?? data.heroSubtitle?.es ?? "",
            heroTagline: data.heroTagline?.[code] ?? data.heroTagline?.es ?? "",
            heroSummary: null,
            portfolioAbout: data.about[code] ?? "",
            availabilityBadge:
              data.availabilityBadge?.[code] ??
              data.availabilityBadge?.es ??
              null,
          },
          update: {
            heroSubtitle:
              data.heroSubtitle?.[code] ?? data.heroSubtitle?.es ?? "",
            heroTagline: data.heroTagline?.[code] ?? data.heroTagline?.es ?? "",
            heroSummary: null,
            portfolioAbout: data.about[code] ?? "",
            availabilityBadge:
              data.availabilityBadge?.[code] ??
              data.availabilityBadge?.es ??
              null,
          },
        });
      }
    }
  }

  const terminal = await prisma.portfolioTerminal.upsert({
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

  await prisma.portfolioTerminalStep.deleteMany({
    where: { terminalId: terminal.id },
  });
  for (const [index, step] of data.terminal.steps.entries()) {
    const commandDefault = step.command.es ?? "";
    const outputDefault = step.output.es ?? "";

    await prisma.portfolioTerminalStep.create({
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
