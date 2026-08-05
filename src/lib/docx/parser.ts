/**
 * lib/docx/parser.ts
 *
 * Extracts adaptable text sections from a .docx buffer.
 *
 * Strategy:
 * - Unzip the .docx with JSZip
 * - Parse word/document.xml with fast-xml-parser
 * - Walk all <w:p> paragraphs
 * - Identify sections by heading paragraphs (style "Heading1" or locale variants)
 * - Collect adaptable paragraphs (bullets, summary) into CvSection[]
 * - Each paragraph's runs are preserved individually so the rebuilder can
 *   replace text by paragraph index + run index without touching formatting
 */

import JSZip from "jszip";
import type { CvSection, CvParagraph, CvRun } from "@/lib/types";
import { parseParagraphFragment } from "./parse-paragraph-fragment";
import { extractParagraphXmlParts } from "./split-paragraphs";
import { coalesceXmlText, extractTextFromWt } from "./xml-text";

// Styles that mark a top-level section heading (add CV-specific style names here)
const HEADING_STYLES = new Set([
  "Heading1",
  "Ttulo1",
  "heading1",
  "Heading 1",
  "1", // some CVs use numeric style IDs
]);

/** Job-role / document title styles — adaptable by AI, but exempt from length budget. */
export const DOCX_TITLE_STYLES = new Set(["Ttulo", "Title", "CustomTitle"]);

export function isDocxTitleStyle(style: string): boolean {
  return DOCX_TITLE_STYLES.has(style);
}

// Styles whose paragraph text should be sent to the AI for adaptation
const ADAPTABLE_STYLES = new Set([
  // Bullet points / achievement lists
  "Prrafodelista",
  "ListParagraph",
  "List Paragraph",
  "BulletList",
  "Listprrafo",
  "list-paragraph",
  // Title / job role headline (adapted by AI; no per-run budget)
  ...DOCX_TITLE_STYLES,
]);

// Special adaptable style that may contain both fixed data (company/date) and
// the "about me" paragraph — we filter by content heuristics below.
const SEMI_ADAPTABLE_STYLES = new Set([
  "Textoindependiente",
  "Body Text",
  "Normal",
]);

/**
 * Returns true if a paragraph that has a "semi-adaptable" style should be
 * sent to the AI. We skip company/date lines (contain "·", year patterns, etc.)
 */
function isSemiAdaptableContent(text: string): boolean {
  // Skip if it looks like a "Company · 2020 – 2023" line
  if (text.includes("·")) return false;
  // Skip if it's predominantly a year range
  if (/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b/.test(text)) return false;
  // Skip very short lines (likely labels/headings we missed)
  if (text.trim().length < 30) return false;
  return true;
}

/** Get the pStyle value from a paragraph's <w:pPr> */
function getParagraphStyle(para: Record<string, unknown>): string {
  try {
    const pPr = para["w:pPr"] as Record<string, unknown> | undefined;
    if (!pPr) return "";
    const pStyle = pPr["w:pStyle"] as Record<string, unknown> | undefined;
    if (!pStyle) return "";
    return coalesceXmlText(pStyle["@_w:val"]);
  } catch {
    return "";
  }
}
function extractRunsFromParagraph(
  para: Record<string, unknown>,
  paraIndex: number,
): { runs: CvRun[]; fullText: string } {
  const runs: CvRun[] = [];

  const rawRuns = para["w:r"];
  if (!rawRuns) return { runs: [], fullText: "" };

  const runArray = Array.isArray(rawRuns) ? rawRuns : [rawRuns];
  let runIdx = 0;

  for (const run of runArray) {
    if (typeof run !== "object" || run === null) continue;
    const r = run as Record<string, unknown>;
    if (!("w:t" in r)) continue;

    const text = extractTextFromWt(r["w:t"]);

    runs.push({
      id: `para-${paraIndex}-run-${runIdx}`,
      text,
    });
    runIdx++;
  }

  return { runs, fullText: runs.map((r) => r.text).join("") };
}

export async function parseDocx(buffer: Buffer): Promise<{
  sections: CvSection[];
  rawXml: string;
  zipFiles: JSZip;
}> {
  // 1. Unzip
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile)
    throw new Error("Invalid .docx: word/document.xml not found");

  const rawXml = await docXmlFile.async("string");

  // Walk every <w:p> in document order (including paragraphs inside layout tables).
  // Indices must match rebuildDocx paragraphCount 1:1.
  const paraXmlParts = extractParagraphXmlParts(rawXml);

  // Build sections from adaptable paragraphs
  const sections: CvSection[] = [];
  let currentSection: CvSection | null = null;
  let sectionIdx = 0;
  let paraIdx = 0;

  for (let i = 0; i < paraXmlParts.length; i++) {
    const para = parseParagraphFragment(paraXmlParts[i]);
    const style = getParagraphStyle(para);
    const { runs, fullText } = extractRunsFromParagraph(para, i);
    const trimmed = fullText.trim();

    if (HEADING_STYLES.has(style)) {
      // Start a new section
      sectionIdx++;
      currentSection = {
        id: `section-${sectionIdx}`,
        heading: trimmed || `Section ${sectionIdx}`,
        paragraphs: [],
      };
      sections.push(currentSection);
      paraIdx = 0;
      continue;
    }

    if (!currentSection) {
      // Paragraphs before the first heading — create implicit section
      if (
        ADAPTABLE_STYLES.has(style) ||
        (SEMI_ADAPTABLE_STYLES.has(style) && isSemiAdaptableContent(trimmed))
      ) {
        currentSection = {
          id: "section-0",
          heading: "Header",
          paragraphs: [],
        };
        sections.unshift(currentSection);
      } else {
        continue;
      }
    }

    // Decide if this paragraph is adaptable
    const isAdaptable =
      ADAPTABLE_STYLES.has(style) ||
      (SEMI_ADAPTABLE_STYLES.has(style) && isSemiAdaptableContent(trimmed));

    if (isAdaptable && runs.length > 0 && trimmed.length > 0) {
      const paragraph: CvParagraph = {
        id: `${currentSection.id}-para-${paraIdx}`,
        runs: runs.map((r, ri) => ({
          ...r,
          id: `${currentSection!.id}-para-${paraIdx}-run-${ri}`,
        })),
        style,
        xmlIndex: i,
      };
      currentSection.paragraphs.push(paragraph);
      paraIdx++;
    }
  }

  // Filter out empty sections
  const nonEmpty = sections.filter((s) => s.paragraphs.length > 0);

  return { sections: nonEmpty, rawXml, zipFiles: zip };
}
