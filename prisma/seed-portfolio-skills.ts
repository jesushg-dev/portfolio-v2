import { readFileSync } from "node:fs";
import type { PrismaClient, Skill, StackType } from "@prisma/client";

export interface PortfolioSkillSeed {
  key: string;
  title: string;
  type: StackType;
  image: string;
  translations: {
    locale: "es" | "en" | "nl";
    description: string;
    urlWiki: string;
  }[];
}

const portfolioSkills = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-skills.json", import.meta.url),
    "utf8",
  ),
) as PortfolioSkillSeed[];

function translationRows(
  skill: PortfolioSkillSeed,
  langIds: Record<"es" | "en" | "nl", string>,
) {
  return skill.translations.map((translation) => ({
    description: translation.description,
    urlWiki: translation.urlWiki,
    appLanguageId: langIds[translation.locale],
  }));
}

export async function seedPortfolioSkills(
  prisma: PrismaClient,
  langIds: Record<"es" | "en" | "nl", string>,
  userId: string,
): Promise<Record<string, Skill>> {
  const result: Record<string, Skill> = {};

  for (const skill of portfolioSkills) {
    const upserted = await prisma.skill.upsert({
      where: {
        userId_title: {
          userId,
          title: skill.title,
        },
      },
      update: {
        type: skill.type,
        image: skill.image,
        SkillTranslation: {
          deleteMany: {},
          createMany: {
            data: translationRows(skill, langIds),
          },
        },
      },
      create: {
        userId,
        title: skill.title,
        type: skill.type,
        image: skill.image,
        SkillTranslation: {
          createMany: {
            data: translationRows(skill, langIds),
          },
        },
      },
    });
    result[skill.key] = upserted;
  }

  return result;
}

export { portfolioSkills };
