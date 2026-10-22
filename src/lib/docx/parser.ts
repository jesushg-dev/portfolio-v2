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
import { normalizeDocumentXml } from "./normalize-runs";

/** Canonical CV paragraph styles for semantic, deterministic parsing. */
export const CV_STYLE = {
  TITLE: "CV-Title",
  HEADING: "CV-Heading",
  SUMMARY: "CV-Summary",
  ROLE: "CV-Role",
  META: "CV-Meta",
  BULLET: "CV-Bullet",
  EDUCATION_DATE: "CV-Education-Date",
  SKILL_LIST: "CV-Skill-List",
  SKILL_ITEM: "CV-Skill-Item",
} as const;

// Styles that mark a top-level section heading (add CV-specific style names here)
const HEADING_STYLES = new Set([
  CV_STYLE.HEADING,
  "Heading1",
  "Ttulo1",
  "heading1",
  "Heading 1",
  "1", // some CVs use numeric style IDs
]);

export const KNOWN_HEADING_TEXTS = new Set([
  "sobre mi",
  "about me",
  "experiencia laboral",
  "experiencia profesional",
  "experiencia",
  "experience",
  "professional experience",
  "habilidades tecnicas",
  "technical skills",
  "skills",
  "educacion",
  "education",
  "idiomas",
  "languages",
  "disponibilidad",
  "availability",
  "habilidades blandas",
  "soft skills",
  "contacto",
  "contact",
]);

export function normalizeHeadingKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:.]/g, "");
}

export function isHeadingParagraph(style: string, trimmed: string): boolean {
  if (style === CV_STYLE.HEADING || HEADING_STYLES.has(style)) return true;
  if (!trimmed || trimmed.length > 40) return false;
  return KNOWN_HEADING_TEXTS.has(normalizeHeadingKey(trimmed));
}

/** Job-role / document title styles — adaptable by AI, but exempt from length budget. */
export const DOCX_TITLE_STYLES = new Set([
  CV_STYLE.TITLE,
  "Ttulo",
  "Title",
  "CustomTitle",
]);

export function isDocxTitleStyle(style: string): boolean {
  return DOCX_TITLE_STYLES.has(style);
}

// Styles whose paragraph text should be sent to the AI for adaptation
const ADAPTABLE_STYLES = new Set([
  CV_STYLE.BULLET,
  CV_STYLE.SKILL_LIST,
  CV_STYLE.SKILL_ITEM,
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

export const WORKPLACE_OR_EMPLOYMENT_RE =
  /\b(remoto|remote|hibrido|híbrido|hybrid|presencial|on-site|onsite|tiempo completo|full-time|fulltime|tiempo parcial|part-time|parttime)\b/i;

export const DATE_OR_YEAR_RE =
  /\b(19|20)\d{2}\b|\b(present|presente|heden|actualidad|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

/**
 * Company / location / date lines, e.g.
 * "Imagemaker · Remote · August 2025 – Present" or "Tiempo completo · Remoto · San José, Costa Rica"
 */
export function isExperienceMetaLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.includes("·")) return false;
  return (
    WORKPLACE_OR_EMPLOYMENT_RE.test(trimmed) || DATE_OR_YEAR_RE.test(trimmed)
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
  paragraphMap?: Map<string, string>,
  paraXmlPart?: string,
): CvParagraph {
  const pId = `${idPrefix}-para-${paraIdx}`;
  if (paragraphMap && paraXmlPart) {
    paragraphMap.set(pId, paraXmlPart);
  }
  return {
    id: pId,
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
  paragraphMap: Map<string, string>;
}> {
  // 1. Unzip
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile)
    throw new Error("Invalid .docx: word/document.xml not found");

  const originalXml = await docXmlFile.async("string");
  const { normalizedXml } = normalizeDocumentXml(originalXml);

  // Walk every <w:p> in document order (including paragraphs inside layout tables).
  // Indices must match rebuildDocx paragraphCount 1:1.
  const paraXmlParts = extractParagraphXmlParts(normalizedXml);

  // Build sections from adaptable paragraphs
  const sections: CvSection[] = [];
  const lockedParagraphs: LockedParagraph[] = [];
  const paragraphMap = new Map<string, string>();
  let currentSection: CvSection | null = null;
  let experienceSection: CvSection | null = null;
  let sectionIdx = 0;
  let lockedIdx = 0;
  let pendingRole: { xmlIndex: number; style: string; runs: CvRun[] } | null =
    null;
  let sawPageBreak = false;

  for (let i = 0; i < paraXmlParts.length; i++) {
    const rawXmlPart = paraXmlParts[i];
    if (
      rawXmlPart.includes('w:type="page"') ||
      rawXmlPart.includes("w:lastRenderedPageBreak")
    ) {
      sawPageBreak = true;
    }

    const para = parseParagraphFragment(rawXmlPart);
    const style = getParagraphStyle(para);
    const { runs, fullText } = extractRunsFromParagraph(para, i);
    const trimmed = fullText.trim();

    if (isHeadingParagraph(style, trimmed)) {
      // Start a new section
      sectionIdx++;
      currentSection = {
        id: `section-${sectionIdx}`,
        heading: trimmed || `Section ${sectionIdx}`,
        paragraphs: [],
      };
      sections.push(currentSection);
      if (normalizeHeadingKey(trimmed).includes("experien")) {
        experienceSection = currentSection;
      }
      pendingRole = null;
      continue;
    }

    if (!currentSection) {
      // Paragraphs before the first heading — create implicit section
      if (
        style === CV_STYLE.TITLE ||
        ADAPTABLE_STYLES.has(style) ||
        (SEMI_ADAPTABLE_STYLES.has(style) && isSemiAdaptableContent(trimmed)) ||
        (style === "" &&
          (trimmed.includes("Fullstack") ||
            trimmed.includes("Developer") ||
            trimmed.includes("Desarrollador")))
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

    // If an experience bullet or role continues across subsequent tables/pages
    if (experienceSection && currentSection !== experienceSection) {
      if (
        style === CV_STYLE.META ||
        style === CV_STYLE.ROLE ||
        isExperienceMetaLine(trimmed) ||
        (sawPageBreak &&
          (isExperienceRoleLine(trimmed) || ADAPTABLE_STYLES.has(style)))
      ) {
        currentSection = experienceSection;
      }
    }

    const isTitleParagraph =
      style === CV_STYLE.TITLE ||
      DOCX_TITLE_STYLES.has(style) ||
      (currentSection?.heading === "Header" &&
        (trimmed.includes("Fullstack") ||
          trimmed.includes("Developer") ||
          trimmed.includes("Desarrollador") ||
          trimmed.includes("Engineer") ||
          trimmed.includes("Ingeniero")));

    // Decide if this paragraph is adaptable
    const isSummaryParagraph =
      style === CV_STYLE.SUMMARY ||
      (SEMI_ADAPTABLE_STYLES.has(style) && isSemiAdaptableContent(trimmed)) ||
      (currentSection != null &&
        normalizeHeadingKey(currentSection.heading).includes("sobre") &&
        isSemiAdaptableContent(trimmed));

    const isSkillsSection =
      currentSection != null &&
      (normalizeHeadingKey(currentSection.heading).includes("habilidad") ||
        normalizeHeadingKey(currentSection.heading).includes("skill"));

    const isSkillParagraph =
      isSkillsSection &&
      (style === CV_STYLE.SKILL_LIST ||
        style === CV_STYLE.SKILL_ITEM ||
        style === "TableParagraph" ||
        trimmed.includes("·"));

    const isAdaptable =
      ADAPTABLE_STYLES.has(style) ||
      isTitleParagraph ||
      isSummaryParagraph ||
      isSkillParagraph;

    if (isAdaptable && runs.length > 0 && trimmed.length > 0) {
      pendingRole = null;
      const paraIndex = currentSection.paragraphs.length;
      const paragraph = buildParagraph(
        currentSection.id,
        paraIndex,
        i,
        style,
        runs,
        paragraphMap,
        rawXmlPart,
      );
      currentSection.paragraphs.push(paragraph);
      continue;
    }

    if (runs.length > 0 && trimmed.length > 0) {
      const isExperience = currentSection === experienceSection;
      const headingNorm =
        currentSection != null
          ? normalizeHeadingKey(currentSection.heading)
          : "";
      const isEducation =
        headingNorm.includes("educaci") || headingNorm.includes("education");

      const isRole =
        style === CV_STYLE.ROLE ||
        (isExperience && isExperienceRoleLine(trimmed));
      const isMeta =
        style === CV_STYLE.META ||
        (isExperience && isExperienceMetaLine(trimmed));
      const isEducationDate =
        style === CV_STYLE.EDUCATION_DATE ||
        (isEducation && isEducationDateLine(trimmed));

      if (isRole) {
        pendingRole = { xmlIndex: i, style, runs };
      } else if (isMeta) {
        if (pendingRole) {
          lockedParagraphs.push({
            kind: "experience-role",
            paragraph: buildParagraph(
              "locked",
              lockedIdx++,
              pendingRole.xmlIndex,
              pendingRole.style,
              pendingRole.runs,
              paragraphMap,
              paraXmlParts[pendingRole.xmlIndex],
            ),
          });
          pendingRole = null;
        }
        lockedParagraphs.push({
          kind: "experience-meta",
          paragraph: buildParagraph(
            "locked",
            lockedIdx++,
            i,
            style,
            runs,
            paragraphMap,
            rawXmlPart,
          ),
        });
      } else if (isEducationDate) {
        pendingRole = null;
        lockedParagraphs.push({
          kind: "education-dates",
          paragraph: buildParagraph(
            "locked",
            lockedIdx++,
            i,
            style,
            runs,
            paragraphMap,
            rawXmlPart,
          ),
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
    rawXml: normalizedXml,
    zipFiles: zip,
    paragraphMap,
  };
}
