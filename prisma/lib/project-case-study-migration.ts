import { z } from "zod";

import {
  CaseStudyContentSchema,
  caseStudyRowToDto,
  type CaseStudyContentDTO,
  type CaseStudySectionDTO,
} from "../../src/features/projects/lib/case-study";

export interface ProjectNarrativeSource {
  challenge?: string | null;
  approach?: string | null;
  outcome?: string | null;
  caseStudy?: unknown;
}

const sourceConstraintsSchema = z.object({
  constraints: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
});

const sectionTitles = {
  en: {
    challenge: "Challenge & constraints",
    approach: "Approach",
    results: "Results",
  },
  es: {
    challenge: "Reto y restricciones",
    approach: "Enfoque",
    results: "Resultados",
  },
  nl: {
    challenge: "Uitdaging & beperkingen",
    approach: "Aanpak",
    results: "Resultaten",
  },
};

function appendText(current: string, text: string): string {
  const next = text.trim();
  if (!next || current.includes(next)) return current;
  return current ? `${current}\n\n${next}` : next;
}

function section(
  key: string,
  title: string,
  kind: CaseStudySectionDTO["kind"] = "CARDS",
): CaseStudySectionDTO {
  return CaseStudyContentSchema.parse({ sections: [{ key, title, kind }] })
    .sections[0];
}

/** One-time data cutover; never used by the application to read old fields. */
export function migrateProjectCaseStudy(
  source: ProjectNarrativeSource,
  locale: string,
): CaseStudyContentDTO | null {
  const row = z.record(z.string(), z.unknown()).parse(source.caseStudy ?? {});
  const content = CaseStudyContentSchema.parse(caseStudyRowToDto(row));
  const { constraints } = sourceConstraintsSchema.parse(source.caseStudy ?? {});
  const titles =
    sectionTitles[locale as keyof typeof sectionTitles] ?? sectionTitles.en;

  const challenge = source.challenge?.trim() ?? "";
  if (challenge || constraints.length > 0) {
    let target = content.sections.find((entry) => entry.key === "challenge");
    if (!target) {
      target = section("challenge", titles.challenge, "STEPS");
      content.sections.unshift(target);
    }
    target.lead = appendText(target.lead, challenge);
    for (const [index, constraint] of constraints.entries()) {
      if (
        target.items.some(
          (item) => item.title === constraint || item.body === constraint,
        )
      )
        continue;
      let key = `constraint-${index + 1}`;
      while (target.items.some((item) => item.key === key)) key += "-copy";
      target.items.push({
        key,
        title: constraint,
        summary: "",
        body: "",
        value: "",
        icon: "",
        tags: [],
        note: "",
      });
    }
  }

  const approach = source.approach?.trim() ?? "";
  if (approach) {
    let target =
      content.sections.find(
        (entry) => entry.key === "approach" || entry.key === "architecture",
      ) ?? content.sections.find((entry) => entry.kind === "LAYERS");
    if (!target) {
      target = section("approach", titles.approach);
      content.sections.splice(
        content.sections[0]?.key === "challenge" ? 1 : 0,
        0,
        target,
      );
    }
    target.lead = appendText(target.lead, approach);
  }

  const outcome = source.outcome?.trim() ?? "";
  if (outcome) {
    let target = content.sections.find((entry) => entry.key === "results");
    if (!target) {
      target = section("results", titles.results);
      content.sections.push(target);
    }
    target.lead = appendText(target.lead, outcome);
  }

  const parsed = CaseStudyContentSchema.parse(content);
  return source.caseStudy || parsed.sections.length > 0 ? parsed : null;
}
