import { readdirSync, readFileSync } from "node:fs";
import type {
  PrismaClient,
  Project,
  ProjectKind,
  ProjectStatus,
  Skill,
  StackType,
} from "@prisma/client";

import {
  CaseStudyContentSchema,
  caseStudyDtoToWrite,
} from "../src/features/projects/lib/case-study";

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
  status?: ProjectStatus;
  startedAt?: string;
  endedAt?: string;
  teamSize?: number;
  translations: {
    locale: "es" | "en" | "nl";
    title: string;
    description: string;
    hook?: string;
    challenge?: string;
    approach?: string;
    outcome?: string;
    caseStudy?: unknown;
  }[];
  skillKeys: string[];
}

export function loadPortfolioProjects(): PortfolioProjectSeed[] {
  const projectsDir = new URL("./data/projects", import.meta.url);
  const files = readdirSync(projectsDir).filter((file) =>
    file.endsWith(".json"),
  );

  const projects = files.map((file) => {
    const raw = readFileSync(
      new URL(`./data/projects/${file}`, import.meta.url),
      "utf8",
    );
    return JSON.parse(raw) as PortfolioProjectSeed;
  });

  return projects.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

const portfolioProjects = loadPortfolioProjects();

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
  const loadedProjects = loadPortfolioProjects();

  await prisma.projectSkill.deleteMany({});
  await prisma.project.deleteMany({ where: { userId } });

  const sortedProjects = [...loadedProjects].sort(
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
        status: project.status ?? "IN_PRODUCTION",
        startedAt: project.startedAt ? new Date(project.startedAt) : null,
        endedAt: project.endedAt ? new Date(project.endedAt) : null,
        teamSize: project.teamSize ?? null,
        ProjectTranslation: {
          createMany: {
            data: project.translations.map((translation) => ({
              title: translation.title,
              description: translation.description,
              hook: translation.hook ?? null,
              challenge: translation.challenge ?? null,
              approach: translation.approach ?? null,
              outcome: translation.outcome ?? null,
              caseStudy: translation.caseStudy
                ? (caseStudyDtoToWrite(
                    CaseStudyContentSchema.parse(translation.caseStudy),
                  ) ?? undefined)
                : undefined,
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

// Standalone execution support
if (
  process.argv[1]?.replace(/\\/g, "/").endsWith("seed-portfolio-projects.ts")
) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  async function runStandalone() {
    console.log("Seeding portfolio projects from prisma/data/projects/...");
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found in database");

    const languages = await prisma.appLanguage.findMany();
    const langIds = languages.reduce(
      (acc, lang) => {
        acc[lang.code as "es" | "en" | "nl"] = lang.id;
        return acc;
      },
      {} as Record<"es" | "en" | "nl", string>,
    );

    const { seedPortfolioSkills } = await import("./seed-portfolio-skills");
    const skillsByKey = await seedPortfolioSkills(prisma, langIds, user.id);

    const seeded = await seedPortfolioProjects(
      prisma,
      langIds,
      skillsByKey,
      user.id,
    );
    console.log(`Seeded ${Object.keys(seeded).length} projects successfully.`);
  }

  runStandalone()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
