import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractParagraphXmlParts } from "./split-paragraphs";
import { normalizeParagraphRuns, normalizeDocumentXml } from "./normalize-runs";

describe("DOCX Run Normalization (T1)", () => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "features",
    "resume-engine",
    "assets",
    "cv-template.docx",
  );

  it("normalizes runs in cv-template.docx without changing paragraph text", async () => {
    const buffer = await readFile(templatePath);
    const zip = await JSZip.loadAsync(buffer);
    const rawXml = await zip.file("word/document.xml")!.async("string");

    const originalParas = extractParagraphXmlParts(rawXml);

    let originalRunsCount = 0;
    let normalizedRunsCount = 0;
    let paragraphsWithTextCount = 0;

    for (const p of originalParas) {
      const originalWt = [...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
      const origText = originalWt.map((m) => m[1] ?? "").join("");

      const normalizedP = normalizeParagraphRuns(p);
      const normalizedWt = [
        ...normalizedP.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g),
      ];
      const normText = normalizedWt.map((m) => m[1] ?? "").join("");

      // CRITICAL: Paragraph text MUST be strictly identical
      expect(normText).toBe(origText);

      // No w:proofErr left
      expect(normalizedP).not.toContain("<w:proofErr");

      if (origText.trim().length > 0) {
        paragraphsWithTextCount++;
        originalRunsCount += originalWt.length;
        normalizedRunsCount += normalizedWt.length;
      }
    }

    console.log({
      paragraphsWithTextCount,
      originalRunsCount,
      normalizedRunsCount,
    });

    // Verification from prompt specification:
    // - ~88 paragraphs with text (we have 89)
    // - fixture drops from ~233 runs with text to <= 130 runs with text!
    expect(paragraphsWithTextCount).toBeGreaterThanOrEqual(85);
    expect(paragraphsWithTextCount).toBeLessThanOrEqual(92);
    expect(normalizedRunsCount).toBeLessThanOrEqual(130);
  });

  it("inspects parsed sections of cv-template.docx", async () => {
    const buffer = await readFile(templatePath);
    const { parseDocx } = await import("./parser");
    const parsed = await parseDocx(buffer);

    console.log(
      "Sections summary:",
      parsed.sections.map((s) => ({
        id: s.id,
        heading: s.heading,
        paragraphCount: s.paragraphs.length,
        paragraphs: s.paragraphs.map((p) => ({
          id: p.id,
          style: p.style,
          text: p.runs.map((r) => r.text).join(""),
        })),
      })),
    );
  });

  it("normalizes entire document xml", async () => {
    const buffer = await readFile(templatePath);
    const zip = await JSZip.loadAsync(buffer);
    const rawXml = await zip.file("word/document.xml")!.async("string");
    const { normalizedXml, paragraphCount } = normalizeDocumentXml(rawXml);
    expect(normalizedXml).not.toContain("<w:proofErr");
    expect(paragraphCount).toBeGreaterThan(0);

    const docOpenP = (normalizedXml.match(/<w:p(?:\s[^>]*)?>/g) ?? []).length;
    const docCloseP = (normalizedXml.match(/<\/w:p>/g) ?? []).length;
    expect(docOpenP).toBe(docCloseP);

    const docOpenR = (normalizedXml.match(/<w:r(?:\s[^>]*)?>/g) ?? []).length;
    const docCloseR = (normalizedXml.match(/<\/w:r>/g) ?? []).length;
    expect(docOpenR).toBe(docCloseR);
  });
});
