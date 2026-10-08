import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { locales } from "@/i18n/config";

import {
  auditCaseStudyParity,
  CaseStudyContentSchema,
  type CaseStudyContentDTO,
} from "./case-study";

interface SeedProject {
  key: string;
  slug?: string;
  githubUrl?: string;
  websiteUrl?: string;
  skillKeys?: string[];
  translations: { locale: string; caseStudy?: unknown }[];
}

const projectsDir = join(process.cwd(), "prisma", "data", "projects");
const projects = readdirSync(projectsDir)
  .filter((file) => file.endsWith(".json"))
  .map(
    (file) =>
      JSON.parse(readFileSync(join(projectsDir, file), "utf8")) as SeedProject,
  );

describe("project case studies in the seed", () => {
  it("validates every case study and keeps the same structure in every locale", () => {
    const problems: string[] = [];

    for (const project of projects) {
      const byLocale: Record<string, CaseStudyContentDTO> = {};

      for (const translation of project.translations) {
        if (!translation.caseStudy) continue;

        const parsed = CaseStudyContentSchema.safeParse(translation.caseStudy);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          problems.push(
            `${project.key}/${translation.locale}: invalid at ${issue?.path.join(".")} (${issue?.message})`,
          );
          continue;
        }

        byLocale[translation.locale] = parsed.data;
      }

      if (Object.keys(byLocale).length === 0) continue;

      for (const locale of locales) {
        if (!byLocale[locale]) {
          problems.push(`${project.key}: missing ${locale} case study`);
        }
      }

      for (const issue of auditCaseStudyParity(byLocale, "en")) {
        problems.push(
          `${project.key}/${issue.locale}: ${issue.path} ${issue.problem}`,
        );
      }
    }

    expect(problems).toEqual([]);
  });

  it("localizes Portfolio v2 case-study content in Spanish and Dutch", () => {
    const project = projects.find((entry) => entry.key === "Portfolio");
    const spanish = project?.translations.find(
      (translation) => translation.locale === "es",
    )?.caseStudy as { sections?: { key: string; title: string }[] } | undefined;
    const dutch = project?.translations.find(
      (translation) => translation.locale === "nl",
    )?.caseStudy as { sections?: { key: string; title: string }[] } | undefined;

    expect(
      spanish?.sections?.find((section) => section.key === "decisions")?.title,
    ).toBe("Decisiones y estrategia");
    expect(
      dutch?.sections?.find((section) => section.key === "decisions")?.title,
    ).toBe("Beslissingen & strategie");
  });

  it("matches the canonical Portfolio case-study metadata and text", () => {
    const project = projects.find((entry) => entry.slug === "portfolio");
    const englishTranslation = project?.translations.find(
      (translation) => translation.locale === "en",
    );
    const english = CaseStudyContentSchema.parse(englishTranslation?.caseStudy);

    expect(project?.githubUrl).toBe(
      "https://github.com/jesushg-dev/portfolio-v2",
    );
    expect(project?.websiteUrl).toBe("https://www.jesushg.com/");
    expect(english.chips).toEqual(["Personal", "Full-stack", "In production"]);
    expect(english.facts).toEqual([
      { key: "my-role", label: "My role", value: "Solo architect & developer" },
      {
        key: "project-type",
        label: "Project type",
        value: "Full-stack platform",
      },
      { key: "category", label: "Category", value: "Personal" },
      {
        key: "timeline",
        label: "Timeline",
        value: "Nov 2022 – Sep 2026 · 240 commits",
      },
    ]);
    expect(project?.skillKeys).toEqual([
      "React",
      "Nextjs",
      "Tailwind",
      "Typescript",
      "Prisma",
      "MongoDb",
      "Trpc",
      "Playwright",
    ]);
    expect(english.nextProjectSlug).toBe("musa-admin");
    expect(
      english.sections.find((section) => section.key === "decisions")?.eyebrow,
    ).toBe("Strategy");

    const dataSection = english.sections.find(
      (section) => section.key === "data-model",
    );
    expect(dataSection?.lead).toContain(
      "the case-study page reads four translated fields (hook, challenge, approach, outcome)",
    );
    expect(dataSection?.code).not.toMatch(
      /^\s*caseStudy\s+CaseStudyContent\?/m,
    );

    const designSection = english.sections.find(
      (section) => section.key === "design-system",
    );
    expect(designSection?.footnotes).toContain(
      "No dark: classes: a data-theme attribute swaps the whole token set",
    );
  });
});
