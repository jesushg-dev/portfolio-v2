import { PDFDocument, StandardFonts } from "pdf-lib";

import { planPdfStamp } from "./plan-pdf-stamp";

describe("planPdfStamp", () => {
  it("keeps similar-length text inside the original box", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const original = "Built APIs with Node.js";
    const width = font.widthOfTextAtSize(original, 11);
    const plan = planPdfStamp(font, "Ships APIs with Node.js", 11, width);
    expect(plan).not.toBeNull();
    expect(plan?.coverWidth).toBe(width);
  });

  it("skips a line that would overflow into the next column", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const original = "HTML";
    const width = font.widthOfTextAtSize(original, 10);
    const plan = planPdfStamp(
      font,
      "Amazon Web Services Lambda and Aurora MySQL",
      10,
      width,
    );
    expect(plan).toBeNull();
  });
});
