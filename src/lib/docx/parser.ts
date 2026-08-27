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
import type {
  CvSection,
  CvParagraph,
  CvRun,
  LockedParagraph,
} from "@/lib/types";
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
 * Company / location / date lines, e.g.
 * "Imagemaker · Remote · August 2025 – Present"
 */
export function isExperienceMetaLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.includes("·")) return false;
  const parts = trimmed
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  // Company · location · dates (years may be split across runs / XML numbers)
  if (parts.length >= 2) return true;
  return (
    /\b(19|20)\d{2}\b/.test(trimmed) ||
    /\b(Present|Presente|Heden|Actualidad)\b/i.test(trimmed)
  );
}

/** Education year-only lines, e.g. "2017-2024" or "2022". */
export function isEducationDateLine(text: string): boolean {
  return /^\s*(19|20)\d{2}(\s*[-–—]\s*(19|20)\d{2})?\s*$/.test(text);
}

/**
 * Role header above an experience meta line, e.g.
 * "Full-time | Senior Software Engineer"
 */
export function isExperienceRoleLine(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.length > 120) return false;
  if (trimmed.includes("·")) return false;
  return trimmed.includes("|");
}

/**
 * Returns true if a paragraph that has a "semi-adaptable" style should be
 * sent to the AI. We skip company/date lines (contain "·", year patterns, etc.)
 */
function isSemiAdaptableContent(text: string): boolean {
  if (isExperienceMetaLine(text)) return false;
  if (isEducationDateLine(text)) return false;
  // Skip if it's predominantly a year range embedded in longer text
  if (/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b/.test(text) && text.length < 40)
    return false;
  // Skip very short lines (likely labels/headings we missed)
  if (text.trim().length < 30) return false;
  return true;
}

function buildParagraph(
  idPrefix: string,
  paraIdx: number,
  xmlIndex: number,
  style: string,
  runs: CvRun[],
): CvParagraph {
  return {
    id: `${idPrefix}-para-${paraIdx}`,
    runs: runs.map((r, ri) => ({
      ...r,
      id: `${idPrefix}-para-${paraIdx}-run-${ri}`,
    })),
    style,
    xmlIndex,
  };
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
  /** Company/date/role lines kept out of AI but updated from CMS draft on export. */
  lockedParagraphs: LockedParagraph[];
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
  const lockedParagraphs: LockedParagraph[] = [];
  let currentSection: CvSection | null = null;
  let sectionIdx = 0;
  let paraIdx = 0;
  let lockedIdx = 0;
  let pendingRole: { xmlIndex: number; style: string; runs: CvRun[] } | null =
    null;

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
      pendingRole = null;
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
      } else if (runs.length > 0 && trimmed.length > 0) {
        if (isExperienceRoleLine(trimmed)) {
          pendingRole = { xmlIndex: i, style, runs };
        } else if (isExperienceMetaLine(trimmed)) {
          if (pendingRole) {
            lockedParagraphs.push({
              kind: "experience-role",
              paragraph: buildParagraph(
                "locked",
                lockedIdx++,
                pendingRole.xmlIndex,
                pendingRole.style,
                pendingRole.runs,
              ),
            });
            pendingRole = null;
          }
          lockedParagraphs.push({
            kind: "experience-meta",
            paragraph: buildParagraph("locked", lockedIdx++, i, style, runs),
          });
        } else if (isEducationDateLine(trimmed)) {
          pendingRole = null;
          lockedParagraphs.push({
            kind: "education-dates",
            paragraph: buildParagraph("locked", lockedIdx++, i, style, runs),
          });
        }
        continue;
      } else {
        continue;
      }
    }

    // Decide if this paragraph is adaptable
    const isAdaptable =
      ADAPTABLE_STYLES.has(style) ||
      (SEMI_ADAPTABLE_STYLES.has(style) && isSemiAdaptableContent(trimmed));

    if (isAdaptable && runs.length > 0 && trimmed.length > 0) {
      pendingRole = null;
      const paragraph = buildParagraph(
        currentSection.id,
        paraIdx,
        i,
        style,
        runs,
      );
      currentSection.paragraphs.push(paragraph);
      paraIdx++;
      continue;
    }

    if (runs.length > 0 && trimmed.length > 0) {
      if (isExperienceRoleLine(trimmed)) {
        pendingRole = { xmlIndex: i, style, runs };
      } else if (isExperienceMetaLine(trimmed)) {
        if (pendingRole) {
          lockedParagraphs.push({
            kind: "experience-role",
            paragraph: buildParagraph(
              "locked",
              lockedIdx++,
              pendingRole.xmlIndex,
              pendingRole.style,
              pendingRole.runs,
            ),
          });
          pendingRole = null;
        }
        lockedParagraphs.push({
          kind: "experience-meta",
          paragraph: buildParagraph("locked", lockedIdx++, i, style, runs),
        });
      } else if (isEducationDateLine(trimmed)) {
        pendingRole = null;
        lockedParagraphs.push({
          kind: "education-dates",
          paragraph: buildParagraph("locked", lockedIdx++, i, style, runs),
        });
      } else {
        pendingRole = null;
      }
    }
  }

  // Filter out empty sections
  const nonEmpty = sections.filter((s) => s.paragraphs.length > 0);

  return {
    sections: nonEmpty,
    lockedParagraphs,
    rawXml,
    zipFiles: zip,
  };
}
