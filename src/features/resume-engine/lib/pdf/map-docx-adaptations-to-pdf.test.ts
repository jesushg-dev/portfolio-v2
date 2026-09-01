import { mapDocxAdaptationsToPdfItems } from "./map-docx-adaptations-to-pdf";
import type { PdfTailorSpan } from "./map-pdf-text-items";

const pdfItem = (runId: string, originalText: string): PdfTailorSpan => ({
  runId,
  pageIndex: 0,
  x: 0,
  y: 0,
  width: 100,
  height: 12,
  fontSize: 11,
  fontFamily: "Calibri",
  originalText,
});

describe("mapDocxAdaptationsToPdfItems", () => {
  it("maps adapted Word paragraphs onto matching PDF spans", () => {
    const mapped = mapDocxAdaptationsToPdfItems(
      [
        {
          id: "s1",
          heading: "Experience",
          paragraphs: [
            {
              id: "p1",
              style: "ListParagraph",
              xmlIndex: 0,
              runs: [{ id: "d1", text: "Built the checkout flow" }],
            },
          ],
        },
      ],
      [
        {
          id: "s1",
          paragraphs: [
            {
              id: "p1",
              runs: [{ id: "d1", text: "Built a resilient checkout flow" }],
            },
          ],
        },
      ],
      [pdfItem("pdf-1", "Built the checkout flow")],
    );

    expect(mapped[0]?.paragraphs[0]?.runs[0]).toEqual({
      id: "pdf-1",
      text: "Built a resilient checkout flow",
    });
  });
});
