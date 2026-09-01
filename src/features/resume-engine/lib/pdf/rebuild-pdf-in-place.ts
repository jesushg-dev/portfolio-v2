import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

import {
  pickPdfStandardFont,
  type PdfTailorSpan,
} from "@/features/resume-engine/lib/pdf/map-pdf-text-items";
import { isSkillChipText } from "@/features/resume-engine/lib/ai/skill-chip-budget";
import { planPdfStamp } from "@/features/resume-engine/lib/pdf/plan-pdf-stamp";
import type { AdaptedSection } from "@/lib/types";

function embedKind(kind: ReturnType<typeof pickPdfStandardFont>) {
  switch (kind) {
    case "HelveticaBold":
      return StandardFonts.HelveticaBold;
    case "TimesRoman":
      return StandardFonts.TimesRoman;
    case "Courier":
      return StandardFonts.Courier;
    default:
      return StandardFonts.Helvetica;
  }
}

/**
 * Keep the original PDF (images, lines, unchanged glyphs) and stamp new text
 * over fragments the AI changed. Edited lines fall back to a standard font.
 */
export async function rebuildPdfInPlace(
  original: Buffer,
  items: PdfTailorSpan[],
  adaptedSections: AdaptedSection[],
): Promise<Buffer> {
  const bytes =
    original instanceof Uint8Array
      ? new Uint8Array(
          original.buffer,
          original.byteOffset,
          original.byteLength,
        )
      : Uint8Array.from(original);
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();
  const fontCache = new Map<string, PDFFont>();

  const embed = async (family: string): Promise<PDFFont> => {
    const kind = pickPdfStandardFont(family);
    const cached = fontCache.get(kind);
    if (cached) return cached;
    const font = await pdf.embedFont(embedKind(kind));
    fontCache.set(kind, font);
    return font;
  };

  const byId = new Map(items.map((item) => [item.runId, item]));

  for (const section of adaptedSections) {
    for (const paragraph of section.paragraphs) {
      for (const run of paragraph.runs) {
        const item = byId.get(run.id);
        if (!item || run.text === item.originalText) continue;

        const page = pages[item.pageIndex];
        if (!page) continue;

        const font = await embed(item.fontFamily);
        const size = Math.max(item.fontSize || 10, 5);
        const plan = planPdfStamp(
          font,
          run.text,
          size,
          item.width,
          isSkillChipText(item.originalText) ? 0.7 : 0.82,
        );
        if (!plan) continue;

        const descent = plan.size * 0.22;
        const coverHeight =
          Math.max(item.height || 0, plan.size) + descent * 0.35;

        page.drawRectangle({
          x: item.x - 0.5,
          y: item.y - descent,
          width: plan.coverWidth + 1,
          height: coverHeight,
          color: rgb(1, 1, 1),
        });

        page.drawText(plan.text, {
          x: item.x,
          y: item.y,
          size: plan.size,
          font,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  return Buffer.from(await pdf.save());
}
