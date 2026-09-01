import type { PDFFont } from "pdf-lib";

export interface PdfStampPlan {
  size: number;
  text: string;
  coverWidth: number;
}

/**
 * Stamp only inside the original glyph box so a two-column CV does not get
 * painted over. Skip (keep original glyphs) if the new line cannot fit.
 */
export function planPdfStamp(
  font: PDFFont,
  text: string,
  originalSize: number,
  originalWidth: number,
  minSizeRatio = 0.82,
): PdfStampPlan | null {
  const maxWidth = Math.max(originalWidth, 1);
  const size = Math.max(originalSize, 5);
  const minSize = size * minSizeRatio;

  let fitted = size;
  while (fitted >= minSize) {
    if (font.widthOfTextAtSize(text, fitted) <= maxWidth + 0.4) {
      return { size: fitted, text, coverWidth: maxWidth };
    }
    fitted -= 0.2;
  }

  return null;
}
