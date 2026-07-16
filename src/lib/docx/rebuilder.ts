/**
 * lib/docx/rebuilder.ts
 *
 * Rebuilds a .docx file from:
 *   - The original zip (with all images/styles intact)
 *   - The original document.xml raw string
 *   - The adapted sections returned by the AI
 *
 * Strategy: direct XML string manipulation.
 * We locate each <w:p> by its index in the paragraph array, then replace
 * the text content of its <w:t> nodes one by one.
 * This avoids any XML serialization that could corrupt attributes or namespaces.
 */

import JSZip from "jszip";

import type { AdaptedSection, CvSection } from "@/lib/types";
import { splitIntoParagraphs } from "./split-paragraphs";

/**
 * Replace <w:t> text nodes inside a single <w:p> XML string.
 * Puts adapted run texts into the matching <w:t> nodes.
 * Preserves all attributes (xml:space, etc.) and formatting.
 */
function replaceWtNodes(paraXml: string, adaptedTexts: string[]): string {
  let runIndex = 0;
  return paraXml.replace(
    /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g,
    (
      _match: string,
      openTag: string,
      _oldText: string,
      closeTag: string,
    ): string => {
      if (runIndex < adaptedTexts.length) {
        const newText = escapeXml(adaptedTexts[runIndex]);
        runIndex++;

        const hasPreserve = openTag.includes("xml:space");
        const needsPreserve = newText.startsWith(" ") || newText.endsWith(" ");
        const finalOpen =
          needsPreserve && !hasPreserve
            ? openTag.replace("<w:t", '<w:t xml:space="preserve"')
            : openTag;

        return `${finalOpen}${newText}${closeTag}`;
      }
      return `${openTag}${closeTag}`;
    },
  );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function rebuildDocx(
  zipFiles: JSZip,
  rawXml: string,
  originalSections: CvSection[],
  adaptedSections: AdaptedSection[],
): Promise<Buffer> {
  const adaptedByXmlIndex = new Map<number, string[]>();
  for (const section of originalSections) {
    const adaptedSection = adaptedSections.find((s) => s.id === section.id);
    if (!adaptedSection) continue;
    for (const origPara of section.paragraphs) {
      const adaptedPara = adaptedSection.paragraphs.find(
        (p) => p.id === origPara.id,
      );
      if (!adaptedPara) continue;
      adaptedByXmlIndex.set(
        origPara.xmlIndex,
        adaptedPara.runs.map((r) => r.text),
      );
    }
  }

  const parts = splitIntoParagraphs(rawXml);
  let paragraphCount = 0;

  const newParts = parts.map((part) => {
    if (!part.startsWith("<w:p")) {
      return part;
    }

    const xmlIndex = paragraphCount++;
    const adaptedTexts = adaptedByXmlIndex.get(xmlIndex);
    if (!adaptedTexts || adaptedTexts.length === 0) return part;
    return replaceWtNodes(part, adaptedTexts);
  });

  const newXml = newParts.join("");

  const newZip = new JSZip();
  const filePromises: Promise<void>[] = [];

  zipFiles.forEach((relativePath, file) => {
    if (file.dir) return;

    if (relativePath === "word/document.xml") {
      newZip.file(relativePath, newXml);
    } else {
      filePromises.push(
        file.async("nodebuffer").then((content) => {
          newZip.file(relativePath, content);
        }),
      );
    }
  });

  await Promise.all(filePromises);

  const output = await newZip.generateAsync({
    type: "nodebuffer",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return output;
}
