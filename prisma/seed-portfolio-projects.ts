import { readFileSync } from "node:fs";
import type {
  PrismaClient,
  Project,
  ProjectKind,
  Skill,
  StackType,
} from "@prisma/client";

export interface PortfolioProjectSeed {
  key: string;
  image: string;
  type: StackType;
  githubUrl: string;
  websiteUrl: string;
  isPrivate: boolean;
  order?: number;
  kind?: ProjectKind;
  slug?: string;
  caseStudyEnabled?: boolean;
  translations: {
    locale: "es" | "en" | "nl";
    title: string;
    description: string;
    hook?: string;
    challenge?: string;
    approach?: string;
    outcome?: string;
  }[];
  skillKeys: string[];
}

const portfolioProjects = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-projects.json", import.meta.url),
    "utf8",
  ),
) as PortfolioProjectSeed[];

function slugFromKey(key: string): string {
  return key
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

export async function seedPortfolioProjects(
  prisma: PrismaClient,
  langIds: Record<"es" | "en" | "nl", string>,
  skillsByKey: Record<string, Skill>,
  userId: string,
): Promise<Record<string, Project>> {
  const result: Record<string, Project> = {};

  await prisma.projectSkill.deleteMany({});
  await prisma.project.deleteMany({ where: { userId } });

  const sortedProjects = [...portfolioProjects].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999),
  );

  for (const project of sortedProjects) {
    const skillIds = project.skillKeys.map((skillKey) => {
      const skill = skillsByKey[skillKey];
      if (!skill) {
        throw new Error(
          `Project "${project.key}" references unknown skill key "${skillKey}"`,
        );
      }
      return skill.id;
    });

    const created = await prisma.project.create({
      data: {
        userId,
        image: project.image,
        type: project.type,
        githubUrl: project.githubUrl || null,
        websiteUrl: project.websiteUrl || null,
        isPrivate: project.isPrivate,
        order: project.order ?? 999,
        kind: project.kind ?? "PERSONAL",
        slug: project.slug ?? slugFromKey(project.key),
        caseStudyEnabled: project.caseStudyEnabled ?? false,
        ProjectTranslation: {
          createMany: {
            data: project.translations.map((translation) => ({
              title: translation.title,
              description: translation.description,
              hook: translation.hook ?? null,
              challenge: translation.challenge ?? null,
              approach: translation.approach ?? null,
              outcome: translation.outcome ?? null,
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
