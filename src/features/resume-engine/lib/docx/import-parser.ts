import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

import type { CvImportTextSection } from "@/features/cv/lib/cv-import-draft";
import { coalesceXmlText, extractTextFromWt } from "@/lib/docx/xml-text";

const HEADING_STYLES = new Set([
  "Heading1",
  "Ttulo1",
  "heading1",
  "Heading 1",
  "1",
  "Heading2",
  "Ttulo2",
  "heading2",
  "Heading 2",
  "2",
]);

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

function extractParagraphText(para: Record<string, unknown>): string {
  const rawRuns = para["w:r"];
  if (!rawRuns) return "";
  const runArray = Array.isArray(rawRuns) ? rawRuns : [rawRuns];
  return runArray
    .map((run) => {
      if (typeof run !== "object" || run === null) return "";
      const r = run as Record<string, unknown>;
      if (!("w:t" in r)) return "";
      return extractTextFromWt(r["w:t"]);
    })
    .join("");
}

function isInsideTable(
  paragraphs: Record<string, unknown>[],
  index: number,
): boolean {
  // Heuristic: skip table cells for v1 import
  const para = paragraphs[index];
  const parent = para["@_parent"] as string | undefined;
  return parent === "w:tc";
}

export async function parseDocxForImport(buffer: Buffer): Promise<{
  sections: CvImportTextSection[];
  plainText: string;
}> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) {
    throw new Error("Invalid .docx: word/document.xml not found");
  }

  const rawXml = await docXmlFile.async("string");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (tagName) =>
      ["w:p", "w:r", "w:t", "w:tbl", "w:tr", "w:tc"].includes(tagName),
    allowBooleanAttributes: true,
    trimValues: false,
  });

  const doc = parser.parse(rawXml) as Record<string, unknown>;
  let paragraphs: Record<string, unknown>[] = [];

  try {
    const body = doc["w:document"] as Record<string, unknown>;
    const wbody = body["w:body"] as Record<string, unknown>;
    const rawParas = wbody["w:p"];
    if (Array.isArray(rawParas)) {
      paragraphs = rawParas as Record<string, unknown>[];
    } else if (rawParas && typeof rawParas === "object") {
      paragraphs = [rawParas as Record<string, unknown>];
    }
  } catch {
    throw new Error("Could not locate w:body paragraphs in document.xml");
  }

  const sections: CvImportTextSection[] = [];
  let current: CvImportTextSection = { heading: "Header", lines: [] };

  for (let i = 0; i < paragraphs.length; i++) {
    if (isInsideTable(paragraphs, i)) continue;

    const para = paragraphs[i];
    const style = getParagraphStyle(para);
    const text = extractParagraphText(para).trim();
    if (!text) continue;

    if (HEADING_STYLES.has(style)) {
      if (current.lines.length > 0) {
        sections.push(current);
      }
      current = { heading: text, lines: [] };
      continue;
    }

    current.lines.push(text);
  }

  if (current.lines.length > 0) {
    sections.push(current);
  }

  const plainText = sections
    .map((s) => `## ${s.heading}\n${s.lines.join("\n")}`)
    .join("\n\n");

  if (sections.length === 0) {
    throw new Error("No readable text found in the document.");
  }

  return { sections, plainText };
}
