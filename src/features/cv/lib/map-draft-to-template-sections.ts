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

export function prioritizeSkillItems(
  items: string[],
  jobDescription?: string,
): string[] {
  if (!jobDescription || jobDescription.trim().length === 0) {
    return items;
  }

  const jdLower = jobDescription.toLowerCase();

  const scored = items.map((item, originalIndex) => {
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

export function collectTechnicalSkillItems(
  draft: CvImportDraft,
  jobDescription?: string,
): string[] {
  const allItems = draft.skills.flatMap((group) =>
    group.items.map((item) => item.trim()).filter((item) => item.length > 0),
  );

  return prioritizeSkillItems(allItems, jobDescription);
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
  const metaParagraphs = (lockedParagraphs ?? []).filter(
    (lp) => lp.kind === "experience-meta",
  );

  const experiences =
    metaParagraphs.length === draft.experiences.length
      ? draft.experiences
      : unifyConsecutiveExperiencesByCompany(draft.experiences);

  let buckets: CvParagraph[][] = [];

  if (metaParagraphs.length > 0) {
    buckets = metaParagraphs.map((meta, i) => {
      const minXml = meta.paragraph.xmlIndex;
      const nextMeta = metaParagraphs[i + 1];
      const maxXml = nextMeta ? nextMeta.paragraph.xmlIndex : Infinity;
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

  const experienceBullets = experiences.flatMap((exp) =>
    exp.responsibilities.filter((item) => item.trim().length > 0),
  );

  // Fallback for flat single-bucket or synthetic tests without gaps
  if (buckets.length <= 1 && experiences.length <= 1) {
    const exp = experiences[0];
    const resps = exp
      ? exp.responsibilities.filter((r) => r.trim().length > 0)
      : experienceBullets;
    const texts = section.paragraphs.map((_, index) => resps[index] ?? "");
    const lastPara = section.paragraphs[section.paragraphs.length - 1];
    const extra =
      lastPara && resps.length > section.paragraphs.length
        ? resps.slice(section.paragraphs.length)
        : undefined;

    return {
      id: section.id,
      paragraphs: section.paragraphs.map((paragraph, index) => {
        const adapted = adaptParagraphText(paragraph, texts[index] ?? "");
        if (extra && paragraph.id === lastPara?.id) {
          adapted.extraBullets = extra;
        }
        return adapted;
      }),
    };
  }

  const textByParaId = new Map<string, string>();
  const extraBulletsByParaId = new Map<string, string[]>();

  buckets.forEach((bucket, expIndex) => {
    const exp = experiences[expIndex];
    const resps = exp
      ? exp.responsibilities.filter((r) => r.trim().length > 0)
      : [];

    bucket.forEach((para, slotIndex) => {
      textByParaId.set(para.id, resps[slotIndex] ?? "");
    });

    if (resps.length > bucket.length && bucket.length > 0) {
      const lastPara = bucket[bucket.length - 1];
      if (lastPara) {
        extraBulletsByParaId.set(lastPara.id, resps.slice(bucket.length));
      }
    }
  });

  return {
    id: section.id,
    paragraphs: section.paragraphs.map((paragraph) => {
      const adapted = adaptParagraphText(
        paragraph,
        textByParaId.get(paragraph.id) ?? "",
      );
      const extra = extraBulletsByParaId.get(paragraph.id);
      if (extra && extra.length > 0) {
        adapted.extraBullets = extra;
      }
      return adapted;
    }),
  };
}

function mapCategoryLineSkills(
  section: CvSection,
  draft: CvImportDraft,
  jobDescription?: string,
): AdaptedSection {
  const getCategoryItems = (categories: string[]) => {
    const matching = draft.skills.filter((g) =>
      categories.includes(g.category),
    );
    const items = matching.flatMap((g) =>
      g.items.map((i) => i.trim()).filter(Boolean),
    );
    return prioritizeSkillItems(items, jobDescription);
  };

  const frontendItems = getCategoryItems(["FRONTEND", "MOBILE"]);
  const backendItems = getCategoryItems(["BACKEND"]);
  const dataItems = getCategoryItems(["DATABASE"]);
  const cloudToolsItems = getCategoryItems([
    "DEVOPS",
    "TOOLS",
    "CYBERSECURITY",
    "DESKTOP",
    "OTHER",
  ]);

  const defaultBuckets = [
    frontendItems,
    backendItems,
    dataItems,
    cloudToolsItems,
  ];

  return {
    id: section.id,
    paragraphs: section.paragraphs.map((paragraph, index) => {
      const origText = paragraph.runs.map((r) => r.text).join("");
      const lower = origText.toLowerCase();

      let itemsToUse: string[] = [];
      if (
        lower.includes("react") ||
        lower.includes("html") ||
        lower.includes("css") ||
        lower.includes("frontend")
      ) {
        itemsToUse = frontendItems;
      } else if (
        lower.includes("node") ||
        lower.includes("net") ||
        lower.includes("python") ||
        lower.includes("backend")
      ) {
        itemsToUse = backendItems;
      } else if (
        lower.includes("sql") ||
        lower.includes("mongo") ||
        lower.includes("postgres") ||
        lower.includes("data")
      ) {
        itemsToUse = dataItems;
      } else if (
        lower.includes("docker") ||
        lower.includes("azure") ||
        lower.includes("git") ||
        lower.includes("cloud") ||
        lower.includes("devops") ||
        lower.includes("tool")
      ) {
        itemsToUse = cloudToolsItems;
      } else {
        itemsToUse = defaultBuckets[index] ?? [];
      }

      const text =
        itemsToUse.length > 0 ? itemsToUse.slice(0, 10).join(" · ") : origText;

      return adaptParagraphText(paragraph, text);
    }),
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

    if (
      heading.includes("about") ||
      heading.includes("sobre") ||
      heading.includes("over")
    ) {
      return mapSectionParagraphs(section, aboutChunks);
    }

    if (
      heading.includes("experience") ||
      heading.includes("experiencia") ||
      heading.includes("werkervaring")
    ) {
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
      heading.includes("habilidad") ||
      (heading.includes("skills") && !heading.includes("soft"))
    ) {
      const isCategoryLineLayout = section.paragraphs.some(
        (p) =>
          p.style === "CV-Skill-List" ||
          p.runs.some((r) => r.text.includes("·")),
      );

      if (isCategoryLineLayout) {
        return mapCategoryLineSkills(section, draft, jobDescription);
      }

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
