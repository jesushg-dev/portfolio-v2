import { TRPCError } from "@trpc/server";

import {
  mapPdfPagesToTailorModel,
  type PdfTailorSpan,
} from "@/features/resume-engine/lib/pdf/map-pdf-text-items";
import type { CvSection } from "@/lib/types";

export interface ParsedPdfForTailor {
  buffer: Buffer;
  sections: CvSection[];
  items: PdfTailorSpan[];
}

export async function parsePdfForTailor(
  buffer: Buffer,
): Promise<ParsedPdfForTailor> {
  const { extractTextItems, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { items: pageItems } = await extractTextItems(pdf);

  const { sections, items } = mapPdfPagesToTailorModel(pageItems);

  if (sections.length === 0 || items.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "This PDF has no selectable text to adapt. Export it from Word (File → Save as PDF) or use the DOCX instead.",
    });
  }

  return { buffer, sections, items };
}
