import type { CvImportDraft } from "./cv-import-draft";
import type {
  AdaptedParagraph,
  AdaptedSection,
  CvParagraph,
  CvSection,
} from "@/lib/types";

function normalizeHeading(heading: string): string {
  return heading.trim().toLowerCase();
}

function adaptParagraphText(
  paragraph: CvParagraph,
  newText: string,
): AdaptedParagraph {
  return {
    id: paragraph.id,
    runs: paragraph.runs.map((run, index) => ({
      id: run.id,
      text: index === 0 ? newText : "",
    })),
  };
}

function splitTextIntoChunks(text: string, chunkCount: number): string[] {
  if (chunkCount <= 0) return [];
  if (chunkCount === 1) return [text.trim()];

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return Array.from({ length: chunkCount }, () => "");
  }

  const chunks: string[] = [];
  const perChunk = Math.ceil(sentences.length / chunkCount);

  for (let index = 0; index < chunkCount; index += 1) {
    const slice = sentences.slice(index * perChunk, (index + 1) * perChunk);
    chunks.push(slice.join(" "));
  }

  return chunks;
}

function collectExperienceBullets(draft: CvImportDraft): string[] {
  return draft.experiences.flatMap((experience) =>
    experience.responsibilities.filter((item) => item.trim().length > 0),
  );
}

export function collectTechnicalSkillItems(
  draft: CvImportDraft,
  jobDescription?: string,
): string[] {
  const allItems = draft.skills.flatMap((group) =>
    group.items.map((item) => item.trim()).filter((item) => item.length > 0),
  );

  if (!jobDescription || jobDescription.trim().length === 0) {
    return allItems;
  }

  const jdLower = jobDescription.toLowerCase();

  const scored = allItems.map((item, originalIndex) => {
    const itemLower = item.toLowerCase();
    let score = 0;
    if (jdLower.includes(itemLower)) {
      score = 2;
    } else {
      const words = itemLower.split(/[\s/.,-]+/).filter((w) => w.length > 1);
      if (words.some((word) => jdLower.includes(word))) {
        score = 1;
      }
    }
    return { item, score, originalIndex };
  });

  scored.sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);

  return scored.map((entry) => entry.item);
}

function mapSectionParagraphs(
  section: CvSection,
  texts: string[],
): AdaptedSection {
  return {
    id: section.id,
    paragraphs: section.paragraphs.map((paragraph, index) =>
      adaptParagraphText(paragraph, texts[index] ?? ""),
    ),
  };
}

export function mapDraftToTemplateSections(
  templateSections: CvSection[],
  draft: CvImportDraft,
  softSkillTexts: string[],
  jobDescription?: string,
): AdaptedSection[] {
  const aboutChunks = splitTextIntoChunks(
    draft.header.summary ?? "",
    templateSections.find((section) =>
      normalizeHeading(section.heading).includes("about"),
    )?.paragraphs.length ?? 1,
  );
  const experienceBullets = collectExperienceBullets(draft);
  const technicalSkillItems = collectTechnicalSkillItems(draft, jobDescription);

  return templateSections.map((section) => {
    const heading = normalizeHeading(section.heading);

    if (heading.includes("header")) {
      const headerText =
        (draft.header.degree?.trim() ?? draft.experiences[0]?.role?.trim()) ||
        draft.header.fullName;
      return mapSectionParagraphs(section, [headerText]);
    }

    if (heading.includes("about")) {
      return mapSectionParagraphs(section, aboutChunks);
    }

    if (heading.includes("experience")) {
      const texts = section.paragraphs.map(
        (_, index) => experienceBullets[index] ?? "",
      );
      return mapSectionParagraphs(section, texts);
    }

    if (heading.includes("soft")) {
      const texts = section.paragraphs.map(
        (_, index) => softSkillTexts[index] ?? "",
      );
      return mapSectionParagraphs(section, texts);
    }

    if (
      heading.includes("technical") ||
      (heading.includes("skills") && !heading.includes("soft"))
    ) {
      if (technicalSkillItems.length > 0) {
        const texts = section.paragraphs.map(
          (_, index) => technicalSkillItems[index] ?? "",
        );
        return mapSectionParagraphs(section, texts);
      }
    }

    return {
      id: section.id,
      paragraphs: section.paragraphs.map((paragraph) =>
        adaptParagraphText(
          paragraph,
          paragraph.runs.map((run) => run.text).join(""),
        ),
      ),
    };
  });
}
