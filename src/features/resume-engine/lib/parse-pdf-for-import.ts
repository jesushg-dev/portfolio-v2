import type { CvImportTextSection } from "@/features/cv/lib/cv-import-draft";

function linesFromPdfText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

/**
 * Extract readable text from a PDF buffer using pdf.js (via unpdf).
 */
export async function parsePdfForImport(buffer: Buffer): Promise<{
  sections: CvImportTextSection[];
  plainText: string;
}> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, {
    mergePages: true,
  });
  const plainText = Array.isArray(text) ? text.join("\n") : text;
  const lines = linesFromPdfText(plainText);

  if (lines.length === 0) {
    throw new Error(
      "No text found in the PDF. Try a text-based PDF or a DOCX.",
    );
  }

  return {
    sections: [{ heading: "Resume", lines }],
    plainText,
  };
}

export function isPdfUpload(fileName: string, mimeType: string): boolean {
  return (
    mimeType.toLowerCase().includes("pdf") ||
    fileName.toLowerCase().endsWith(".pdf")
  );
}

/** Detect a PDF even when the CDN URL has no .pdf suffix. */
export function isPdfResumeFile(input: {
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
}): boolean {
  if (input.mimeType?.toLowerCase().includes("pdf")) return true;
  if (input.fileName?.toLowerCase().endsWith(".pdf")) return true;
  return (input.url?.toLowerCase() ?? "").includes(".pdf");
}

export function isDocxUpload(fileName: string, mimeType: string): boolean {
  return (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    fileName.toLowerCase().endsWith(".docx") ||
    fileName.toLowerCase().endsWith(".doc")
  );
}
