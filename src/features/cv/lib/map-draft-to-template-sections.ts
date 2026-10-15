import type { CvImportDraft } from "./cv-import-draft";
import { unifyConsecutiveExperiencesByCompany } from "@/lib/cv/group-consecutive-experiences-by-company";
import type {
  AdaptedParagraph,
  AdaptedSection,
  CvParagraph,
  CvSection,
  LockedParagraph,
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

function mapExperienceSection(
  section: CvSection,
  draft: CvImportDraft,
  lockedParagraphs?: LockedParagraph[],
): AdaptedSection {
  const unifiedExperiences = unifyConsecutiveExperiencesByCompany(
    draft.experiences,
  );

  const metaParagraphs = (lockedParagraphs ?? []).filter(
    (lp) => lp.kind === "experience-meta",
  );
  const roleParagraphs = (lockedParagraphs ?? []).filter(
    (lp) => lp.kind === "experience-role",
  );

  let buckets: CvParagraph[][] = [];

  if (metaParagraphs.length > 0) {
    buckets = metaParagraphs.map((meta, i) => {
      const minXml = meta.paragraph.xmlIndex;
      const nextRole = roleParagraphs[i + 1];
      const maxXml = nextRole ? nextRole.paragraph.xmlIndex : Infinity;
      return section.paragraphs.filter(
        (p) => p.xmlIndex > minXml && p.xmlIndex < maxXml,
      );
    });
  } else {
    // Detect xmlIndex jumps (> 1 between bullet paragraphs)
    let currentBucket: CvParagraph[] = [];
    for (let i = 0; i < section.paragraphs.length; i++) {
      const curr = section.paragraphs[i];
      const prev = section.paragraphs[i - 1];
      if (prev && curr.xmlIndex - prev.xmlIndex > 1) {
        if (currentBucket.length > 0) buckets.push(currentBucket);
        currentBucket = [curr];
      } else {
        currentBucket.push(curr);
      }
    }
    if (currentBucket.length > 0) buckets.push(currentBucket);
  }

  // Fallback for flat single-bucket or synthetic tests without gaps
  if (buckets.length <= 1 && unifiedExperiences.length <= 1) {
    const experienceBullets = unifiedExperiences.flatMap((exp) =>
      exp.responsibilities.filter((item) => item.trim().length > 0),
    );
    const texts = section.paragraphs.map(
      (_, index) => experienceBullets[index] ?? "",
    );
    return mapSectionParagraphs(section, texts);
  }

  const textByParaId = new Map<string, string>();

  buckets.forEach((bucket, expIndex) => {
    const exp = unifiedExperiences[expIndex];
    const resps = exp
      ? exp.responsibilities.filter((r) => r.trim().length > 0)
      : [];

    bucket.forEach((para, slotIndex) => {
      textByParaId.set(para.id, resps[slotIndex] ?? "");
    });
  });

  return {
    id: section.id,
    paragraphs: section.paragraphs.map((paragraph) =>
      adaptParagraphText(paragraph, textByParaId.get(paragraph.id) ?? ""),
    ),
  };
}

export function mapDraftToTemplateSections(
  templateSections: CvSection[],
  draft: CvImportDraft,
  softSkillTexts: string[],
  jobDescription?: string,
  lockedParagraphs?: LockedParagraph[],
): AdaptedSection[] {
  const aboutChunks = splitTextIntoChunks(
    draft.header.summary ?? "",
    templateSections.find((section) =>
      normalizeHeading(section.heading).includes("about"),
    )?.paragraphs.length ?? 1,
  );
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
      return mapExperienceSection(section, draft, lockedParagraphs);
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
