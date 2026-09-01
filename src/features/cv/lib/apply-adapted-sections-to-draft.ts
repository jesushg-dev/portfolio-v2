import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { AdaptedSection, CvSection } from "@/lib/types";

function normalizeHeading(heading: string): string {
  return heading.trim().toLowerCase();
}

function paragraphText(section: AdaptedSection, index: number): string {
  const paragraph = section.paragraphs[index];
  if (!paragraph) return "";
  return paragraph.runs
    .map((run) => run.text)
    .join("")
    .trim();
}

function sectionTexts(section: AdaptedSection): string[] {
  return section.paragraphs
    .map((_, index) => paragraphText(section, index))
    .filter((text) => text.length > 0);
}

/**
 * Overlay DOCX tailor run text onto the structured CMS draft so ATS preview
 * reflects the tailored wording, not the pre-tailor snapshot.
 */
export function applyAdaptedSectionsToDraft(
  draft: CvImportDraft,
  templateSections: CvSection[],
  adaptedSections: AdaptedSection[],
): CvImportDraft {
  const adaptedById = new Map(
    adaptedSections.map((section) => [section.id, section]),
  );
  const next: CvImportDraft = {
    ...draft,
    header: { ...draft.header },
    experiences: draft.experiences.map((experience) => ({
      ...experience,
      responsibilities: [...experience.responsibilities],
    })),
    skills: draft.skills.map((group) => ({
      ...group,
      items: [...group.items],
    })),
  };

  const experienceBullets: string[] = [];

  for (const template of templateSections) {
    const adapted = adaptedById.get(template.id);
    if (!adapted) continue;
    const heading = normalizeHeading(template.heading);

    if (heading.includes("about")) {
      const summary = sectionTexts(adapted).join(" ").trim();
      if (summary) next.header.summary = summary;
      continue;
    }

    if (heading.includes("experience")) {
      experienceBullets.push(...sectionTexts(adapted));
      continue;
    }

    if (
      heading.includes("technical") ||
      (heading.includes("skills") && !heading.includes("soft"))
    ) {
      const items = sectionTexts(adapted);
      if (items.length === 0) continue;
      if (next.skills.length === 0) {
        next.skills = [{ category: "OTHER", items }];
      } else {
        next.skills = next.skills.map((group, index) =>
          index === 0 ? { ...group, items } : group,
        );
      }
    }
  }

  if (experienceBullets.length > 0) {
    let cursor = 0;
    next.experiences = next.experiences.map((experience) => {
      const count = Math.max(experience.responsibilities.length, 0);
      if (count === 0) return experience;
      const slice = experienceBullets.slice(cursor, cursor + count);
      cursor += count;
      if (slice.length === 0) return experience;
      return {
        ...experience,
        responsibilities: experience.responsibilities.map(
          (original, index) => slice[index] ?? original,
        ),
      };
    });
  }

  return next;
}
