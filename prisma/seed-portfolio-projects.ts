import { readFileSync } from "node:fs";
import { ObjectId } from "bson";
import type { PrismaClient, Project, Skill, StackType } from "@prisma/client";

export interface PortfolioProjectSeed {
  key: string;
  image: string;
  type: StackType;
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

const portfolioProjects = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-projects.json", import.meta.url),
    "utf8",
  ),
) as PortfolioProjectSeed[];

export async function seedPortfolioProjects(
  prisma: PrismaClient,
  langIds: Record<"es" | "en" | "nl", string>,
  skillsByKey: Record<string, Skill>,
): Promise<Record<string, Project>> {
  const result: Record<string, Project> = {};

  for (const project of portfolioProjects) {
    const skillIds = project.skillKeys.map((skillKey) => {
      const skill = skillsByKey[skillKey];
      if (!skill) {
        throw new Error(
          `Project "${project.key}" references unknown skill key "${skillKey}"`,
        );
      }
      return skill.id;
    });

    const created = await prisma.project.upsert({
      where: { id: new ObjectId().toString() },
      update: {},
      create: {
        image: project.image,
        type: project.type,
        githubUrl: project.githubUrl || null,
        websiteUrl: project.websiteUrl || null,
        isPrivate: project.isPrivate,
        ProjectTranslation: {
          createMany: {
            data: project.translations.map((translation) => ({
              title: translation.title,
              description: translation.description,
              appLanguageId: langIds[translation.locale],
            })),
          },
        },
        ProjectSkill: skillIds.length
          ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
          : undefined,
      },
    });

    result[project.key] = created;
  }

  return result;
}

export { portfolioProjects };
