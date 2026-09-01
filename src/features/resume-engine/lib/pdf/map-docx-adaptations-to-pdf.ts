import type { AdaptedSection, CvSection } from "@/lib/types";
import type { PdfTailorSpan } from "@/features/resume-engine/lib/pdf/map-pdf-text-items";

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function paragraphText(runs: { text: string }[]): string {
  return runs.map((run) => run.text).join("");
}

/**
 * Map Word tailor output onto PDF parser spans so `rebuildPdfInPlace` can
 * stamp the same adaptations even when the source file was a DOCX.
 */
export function mapDocxAdaptationsToPdfItems(
  originalSections: CvSection[],
  adaptedSections: AdaptedSection[],
  pdfItems: PdfTailorSpan[],
): AdaptedSection[] {
  const adaptedBySection = new Map(
    adaptedSections.map((section) => [section.id, section]),
  );

  const pairs: { original: string; adapted: string; used: boolean }[] = [];

  for (const section of originalSections) {
    const adaptedSection = adaptedBySection.get(section.id);
    const adaptedByPara = new Map(
      (adaptedSection?.paragraphs ?? []).map((paragraph) => [
        paragraph.id,
        paragraph,
      ]),
    );

    for (const paragraph of section.paragraphs) {
      const original = normalize(paragraphText(paragraph.runs));
      if (!original) continue;
      const adaptedParagraph = adaptedByPara.get(paragraph.id);
      const adapted = adaptedParagraph
        ? paragraphText(adaptedParagraph.runs)
        : paragraphText(paragraph.runs);
      pairs.push({ original, adapted, used: false });
    }
  }

  const runs = pdfItems.map((item) => {
    const key = normalize(item.originalText);
    const exact = pairs.find((pair) => !pair.used && pair.original === key);
    if (exact) {
      exact.used = true;
      return { id: item.runId, text: exact.adapted };
    }

    const fuzzy = pairs.find((pair) => {
      if (pair.used) return false;
      const shorter = key.length <= pair.original.length ? key : pair.original;
      const longer = shorter === key ? pair.original : key;
      return shorter.length >= 16 && longer.includes(shorter);
    });
    if (fuzzy) {
      fuzzy.used = true;
      return { id: item.runId, text: fuzzy.adapted };
    }

    return { id: item.runId, text: item.originalText };
  });

  return [
    {
      id: "pdf-from-docx",
      paragraphs: runs.map((run, index) => ({
        id: `pdf-mapped-${index}`,
        runs: [run],
      })),
    },
  ];
}
