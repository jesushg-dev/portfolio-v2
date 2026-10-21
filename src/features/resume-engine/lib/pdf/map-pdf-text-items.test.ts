import {
  isLockedPdfSpan,
  isPdfSectionHeading,
  mapPdfPagesToTailorModel,
  pickPdfStandardFont,
} from "./map-pdf-text-items";

describe("mapPdfPagesToTailorModel", () => {
  it("locks contacts, dates, and experience meta lines", () => {
    expect(isLockedPdfSpan("jane@example.com")).toBe(true);
    expect(isLockedPdfSpan("https://example.com")).toBe(true);
    expect(isLockedPdfSpan("+34 600 123 456")).toBe(true);
    expect(isLockedPdfSpan("2017-2024")).toBe(true);
    expect(isLockedPdfSpan("Imagemaker · Remote · August 2025 – Present")).toBe(
      true,
    );
    expect(isLockedPdfSpan("TypeScript")).toBe(false);
    expect(isLockedPdfSpan("C# / .NET Core")).toBe(false);
    expect(isPdfSectionHeading("Front-end")).toBe(true);
    expect(isPdfSectionHeading("Back-end")).toBe(true);
    expect(isLockedPdfSpan("HABILIDADES TÉCNICAS")).toBe(true);
    expect(
      isLockedPdfSpan(
        "Built APIs with Node.js and improved checkout conversion.",
      ),
    ).toBe(false);
  });

  it("merges adjacent words on the same line into one run", () => {
    const { items } = mapPdfPagesToTailorModel([
      [
        {
          str: "Shipped",
          x: 40,
          y: 640,
          width: 40,
          height: 11,
          fontSize: 11,
          fontFamily: "Calibri",
        },
        {
          str: "a React dashboard",
          x: 84,
          y: 640,
          width: 110,
          height: 11,
          fontSize: 11,
          fontFamily: "Calibri",
        },
      ],
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.originalText).toBe("Shipped a React dashboard");
  });

  it("maps one run per selectable span and skips locked text", () => {
    const { sections, items } = mapPdfPagesToTailorModel([
      [
        {
          str: "hello@mail.com",
          x: 10,
          y: 700,
          width: 80,
          height: 10,
          fontSize: 10,
          fontFamily: "Helvetica",
        },
        {
          str: "Shipped a React dashboard for operations.",
          x: 40,
          y: 640,
          width: 220,
          height: 11,
          fontSize: 11,
          fontFamily: "Calibri",
        },
      ],
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.originalText).toContain("React dashboard");
    expect(sections).toHaveLength(1);
    expect(sections[0]?.paragraphs[0]?.runs[0]?.id).toBe(items[0]?.runId);
  });

  it("keeps Front-end and Back-end skills in separate groups", () => {
    const chip = (
      str: string,
      y: number,
    ): {
      str: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      fontFamily: string;
    } => ({
      str,
      x: 40,
      y,
      width: 50,
      height: 10,
      fontSize: 10,
      fontFamily: "Calibri",
    });

    const { sections } = mapPdfPagesToTailorModel([
      [
        chip("Front-end", 500),
        chip("React", 480),
        chip("TypeScript", 460),
        chip("Back-end", 440),
        chip("C# / .NET Core", 420),
        chip("Nest.js", 400),
      ],
    ]);

    const front = sections.find((section) => section.heading === "Front-end");
    const back = sections.find((section) => section.heading === "Back-end");
    expect(
      front?.paragraphs.map((paragraph) => paragraph.runs[0]?.text),
    ).toEqual(["React", "TypeScript"]);
    expect(
      back?.paragraphs.map((paragraph) => paragraph.runs[0]?.text),
    ).toEqual(["C# / .NET Core", "Nest.js"]);
  });

  it("picks a standard font family from the PDF font name", () => {
    expect(pickPdfStandardFont("TimesNewRomanPSMT")).toBe("TimesRoman");
    expect(pickPdfStandardFont("CourierNew")).toBe("Courier");
    expect(pickPdfStandardFont("Arial-BoldMT")).toBe("HelveticaBold");
    expect(pickPdfStandardFont("Calibri")).toBe("Helvetica");
  });
});
