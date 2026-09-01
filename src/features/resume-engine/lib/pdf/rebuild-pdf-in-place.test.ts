import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { rebuildPdfInPlace } from "./rebuild-pdf-in-place";

describe("rebuildPdfInPlace", () => {
  it("stamps adapted text onto the original PDF page", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 500]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const originalText = "Original line of text";
    const size = 12;
    page.drawText(originalText, {
      x: 40,
      y: 400,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    const saved = await doc.save();
    const buffer = Buffer.from(
      saved.buffer,
      saved.byteOffset,
      saved.byteLength,
    );
    const width = font.widthOfTextAtSize(originalText, size);

    const rebuilt = await rebuildPdfInPlace(
      buffer,
      [
        {
          runId: "r1",
          pageIndex: 0,
          x: 40,
          y: 400,
          width,
          height: size,
          fontSize: size,
          fontFamily: "Helvetica",
          originalText,
        },
      ],
      [
        {
          id: "s1",
          paragraphs: [
            {
              id: "p1",
              runs: [{ id: "r1", text: "Adapted line of text" }],
            },
          ],
        },
      ],
    );

    const reloaded = await PDFDocument.load(Uint8Array.from(rebuilt));
    expect(reloaded.getPageCount()).toBe(1);
    expect(rebuilt.byteLength).toBeGreaterThan(buffer.byteLength);
  });
});
