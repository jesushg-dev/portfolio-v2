import { readFileSync } from "node:fs";
import { ObjectId } from "bson";
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

export async function seedPortfolioSkills(
  prisma: PrismaClient,
  langIds: Record<"es" | "en" | "nl", string>,
): Promise<Record<string, Skill>> {
  const result: Record<string, Skill> = {};

  for (const skill of portfolioSkills) {
    const created = await prisma.skill.upsert({
      where: { id: new ObjectId().toString() },
      update: {},
      create: {
        title: skill.title,
        type: skill.type,
        image: skill.image,
        SkillTranslation: {
          createMany: {
            data: skill.translations.map((translation) => ({
              description: translation.description,
              urlWiki: translation.urlWiki,
              appLanguageId: langIds[translation.locale],
            })),
          },
        },
      },
    });
    result[skill.key] = created;
  }

  return result;
}

export { portfolioSkills };
