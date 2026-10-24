import { z } from "zod";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { ResumeTemplate } from "./template-registry";

export function requiredResumeCoverage(
  source: CvImportDraft,
  template: ResumeTemplate,
) {
  const capacity = template.experiencePages.reduce(
    (sum, count) => sum + count,
    0,
  );
  return {
    experienceIds:
      template.pages > 1 && source.experiences.length <= capacity
        ? source.experiences.map((exp) => exp.id)
        : [],
    educationIds: source.education
      .slice(0, template.pages > 1 ? 3 : 2)
      .map((edu) => edu.id),
    languageIds: source.languages.flatMap((lang) => (lang.id ? [lang.id] : [])),
    skills: source.skills
      .filter(
        (skill) =>
          ["FRONTEND", "BACKEND", "DATABASE", "DEVOPS", "TOOLS"].includes(
            skill.category,
          ) && skill.items.length,
      )
      .map((skill) => ({
        id: skill.id,
        minimumItems: Math.min(template.pages > 1 ? 3 : 2, skill.items.length),
      })),
  };
}

export function validateResumeCoverage(
  source: CvImportDraft,
  selection: ResumeSelection,
  template: ResumeTemplate,
): void {
  const required = requiredResumeCoverage(source, template);
  const missing = [
    ...required.experienceIds
      .filter((id) => !selection.experiences.some((exp) => exp.id === id))
      .map((id) => `experience ${id}`),
    ...required.educationIds
      .filter((id) => !selection.educationIds.includes(id))
      .map((id) => `education ${id}`),
    ...required.languageIds
      .filter((id) => !selection.languageIds.includes(id))
      .map((id) => `language ${id}`),
    ...required.skills
      .filter(
        (group) =>
          (selection.skills.find((skill) => skill.id === group.id)?.items
            .length ?? 0) < group.minimumItems,
      )
      .map((group) => `skill group ${group.id} (${group.minimumItems} items)`),
  ];
  if (missing.length)
    throw new Error(
      `selection: preserve career and profile coverage: ${missing.join(", ")}. Condense achievements before removing these records.`,
    );
}

export const ResumeSelectionSchema = z
  .object({
    experiences: z.array(
      z
        .object({
          id: z.string().min(1),
          responsibilityIds: z.array(z.string().min(1)),
        })
        .strict(),
    ),
    educationIds: z.array(z.string().min(1)),
    skills: z.array(
      z
        .object({
          id: z.string().min(1),
          items: z.array(z.string().min(1)).min(1),
        })
        .strict(),
    ),
    languageIds: z.array(z.string().min(1)),
    certificationIds: z.array(z.string().min(1)),
  })
  .strict();
export type ResumeSelection = z.infer<typeof ResumeSelectionSchema>;

/** Only CMS-backed facts may enter a selection. Preserve source chronology. */
export function selectResumeSource(
  source: CvImportDraft,
  selection: ResumeSelection,
): CvImportDraft {
  const issues: string[] = [];
  const checkIds = (
    path: string,
    selected: string[],
    available: (string | undefined)[],
  ) => {
    const seen = new Set<string>();
    for (const id of selected) {
      if (seen.has(id)) issues.push(`${path}.${id}: duplicate selection`);
      else if (!available.includes(id))
        issues.push(`${path}.${id}: unknown CMS identifier`);
      seen.add(id);
    }
  };
  checkIds(
    "selection.experiences",
    selection.experiences.map((exp) => exp.id),
    source.experiences.map((exp) => exp.id),
  );
  checkIds(
    "selection.educationIds",
    selection.educationIds,
    source.education.map((edu) => edu.id),
  );
  checkIds(
    "selection.skills",
    selection.skills.map((skill) => skill.id),
    source.skills.map((skill) => skill.id),
  );
  checkIds(
    "selection.languageIds",
    selection.languageIds,
    source.languages.map((lang) => lang.id),
  );
  checkIds(
    "selection.certificationIds",
    selection.certificationIds,
    source.certifications.map((cert) => cert.id),
  );
  const experiences = source.experiences
    .filter((exp) => selection.experiences.some((item) => item.id === exp.id))
    .map((exp) => {
      const selected = selection.experiences.find(
        (item) => item.id === exp.id,
      )!;
      checkIds(
        `selection.experiences.${exp.id}.responsibilityIds`,
        selected.responsibilityIds,
        exp.responsibilityIds ?? [],
      );
      if (exp.responsibilities.length && !selected.responsibilityIds.length)
        issues.push(
          `selection.experiences.${exp.id}: select at least one supporting achievement`,
        );
      const bullets = selected.responsibilityIds.flatMap((id) => {
        const index = exp.responsibilityIds?.indexOf(id) ?? -1;
        return index >= 0 ? [{ id, text: exp.responsibilities[index] }] : [];
      });
      return {
        ...exp,
        responsibilities: bullets.map((bullet) => bullet.text),
        responsibilityIds: bullets.map((bullet) => bullet.id),
        atsResponsibilities: [],
      };
    });
  const skills = source.skills
    .filter((skill) => selection.skills.some((item) => item.id === skill.id))
    .map((skill) => {
      const selected = selection.skills.find((item) => item.id === skill.id)!;
      checkIds(
        `selection.skills.${skill.id}.items`,
        selected.items,
        skill.items,
      );
      return { ...skill, items: [...selected.items] };
    });
  if (source.experiences.length && !experiences.length)
    issues.push(
      "selection.experiences: select at least one relevant experience",
    );
  if (issues.length)
    throw new Error(`Resume selection failed:\n${issues.join("\n")}`);
  return {
    ...source,
    experiences,
    skills,
    education: source.education.filter((edu) =>
      selection.educationIds.includes(edu.id),
    ),
    languages: source.languages.filter(
      (lang) => lang.id && selection.languageIds.includes(lang.id),
    ),
    certifications: source.certifications.filter(
      (cert) => cert.id && selection.certificationIds.includes(cert.id),
    ),
  };
}
