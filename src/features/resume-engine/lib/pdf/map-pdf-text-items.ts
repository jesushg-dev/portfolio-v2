import { isEducationDateLine, isExperienceMetaLine } from "@/lib/docx/parser";
import type { CvSection } from "@/lib/types";

export interface PdfExtractedSpan {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
}

export interface PdfTailorSpan {
  runId: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  originalText: string;
}

export type PdfStandardFontKind =
  "Helvetica" | "HelveticaBold" | "TimesRoman" | "Courier";

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const URL_RE = /\b(https?:\/\/|www\.)/i;
const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/;

const PDF_SECTION_HEADINGS = new Set([
  "contacto",
  "contact",
  "educación",
  "educacion",
  "education",
  "idiomas",
  "languages",
  "habilidades técnicas",
  "habilidades tecnicas",
  "technical skills",
  "sobre mí",
  "sobre mi",
  "about me",
  "experiencia profesional",
  "professional experience",
  "experience",
  "front-end",
  "frontend",
  "back-end",
  "backend",
  "bases de datos",
  "databases",
  "herramientas",
  "tools",
]);

function normalizeHeadingKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:.]/g, "");
}

/** Column/group labels — stay as glyphs; they start a new tailor section. */
export function isPdfSectionHeading(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (PDF_SECTION_HEADINGS.has(normalizeHeadingKey(trimmed))) return true;
  const letters = trimmed.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  const isAllCaps =
    letters.length >= 7 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-ZÁÉÍÓÚÑ]/.test(trimmed);
  return isAllCaps;
}

/** Fragments that must stay as original glyphs (contacts, dates, company meta, headings). */
export function isLockedPdfSpan(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (
    EMAIL_RE.test(trimmed) ||
    URL_RE.test(trimmed) ||
    PHONE_RE.test(trimmed)
  ) {
    return true;
  }
  if (isExperienceMetaLine(trimmed) || isEducationDateLine(trimmed)) {
    return true;
  }
  if (trimmed === "•") return true;
  if (isPdfSectionHeading(trimmed)) return true;
  return false;
}

export function pickPdfStandardFont(fontFamily: string): PdfStandardFontKind {
  const family = fontFamily.toLowerCase();
  if (family.includes("courier") || family.includes("mono")) return "Courier";
  if (
    family.includes("times") ||
    family.includes("georgia") ||
    family.includes("garamond") ||
    family.includes("serif")
  ) {
    return "TimesRoman";
  }
  if (
    family.includes("bold") ||
    family.includes("black") ||
    family.includes("heavy")
  ) {
    return "HelveticaBold";
  }
  return "Helvetica";
}

function joinSpanText(
  left: string,
  right: string,
  gap: number,
  fontSize: number,
): string {
  if (left.endsWith(" ") || right.startsWith(" ")) return `${left}${right}`;
  if (gap > fontSize * 0.12) return `${left} ${right}`;
  return `${left}${right}`;
}

/** Same reading line (not a second column) — one AI run, like a DOCX paragraph. */
export function mergePdfSpansOnLine(
  spans: PdfExtractedSpan[],
): PdfExtractedSpan[] {
  const readable = spans.filter((span) => span.str.trim().length > 0);
  const ordered = [...readable].sort((a, b) => b.y - a.y || a.x - b.x);
  const merged: PdfExtractedSpan[] = [];

  for (const span of ordered) {
    const prev = merged[merged.length - 1];
    if (!prev) {
      merged.push({ ...span });
      continue;
    }

    const yTol = Math.max(prev.fontSize, span.fontSize, 8) * 0.35;
    const prevRight = prev.x + prev.width;
    const gap = span.x - prevRight;
    const maxGap = Math.max(prev.fontSize, span.fontSize) * 2.5;
    const sameLine =
      Math.abs(prev.y - span.y) <= yTol && gap >= -2 && gap <= maxGap;

    if (!sameLine) {
      merged.push({ ...span });
      continue;
    }

    const fontSize = Math.max(prev.fontSize, span.fontSize);
    merged[merged.length - 1] = {
      str: joinSpanText(prev.str, span.str, gap, fontSize),
      x: prev.x,
      y: Math.min(prev.y, span.y),
      width: Math.max(prevRight, span.x + span.width) - prev.x,
      height: Math.max(prev.height, span.height),
      fontSize,
      fontFamily: prev.fontFamily || span.fontFamily,
    };
  }

  return merged;
}

export function mapPdfPagesToTailorModel(pages: PdfExtractedSpan[][]): {
  sections: CvSection[];
  items: PdfTailorSpan[];
} {
  const sections: CvSection[] = [];
  const items: PdfTailorSpan[] = [];
  let xmlIndex = 0;
  let sectionIdx = 0;

  pages.forEach((pageItems, pageIndex) => {
    let current: CvSection | null = null;

    const flush = () => {
      if (current && current.paragraphs.length > 0) {
        sections.push(current);
      }
      current = null;
    };

    mergePdfSpansOnLine(pageItems).forEach((span, spanIndex) => {
      const text = span.str;
      if (isPdfSectionHeading(text)) {
        flush();
        sectionIdx += 1;
        current = {
          id: `pdf-sec-${sectionIdx}`,
          heading: text.trim(),
          paragraphs: [],
        };
        return;
      }
      if (isLockedPdfSpan(text)) return;

      if (!current) {
        sectionIdx += 1;
        current = {
          id: `pdf-sec-${sectionIdx}`,
          heading: `Page ${pageIndex + 1}`,
          paragraphs: [],
        };
      }

      const runId = `pdf-p${pageIndex}-i${spanIndex}-run-0`;
      const paraId = `pdf-p${pageIndex}-i${spanIndex}`;

      items.push({
        runId,
        pageIndex,
        x: span.x,
        y: span.y,
        width: span.width,
        height: span.height,
        fontSize: span.fontSize,
        fontFamily: span.fontFamily,
        originalText: text,
      });

      current.paragraphs.push({
        id: paraId,
        style: "pdf-span",
        xmlIndex: xmlIndex++,
        runs: [{ id: runId, text }],
      });
    });

    flush();
  });

  return { sections, items };
}
