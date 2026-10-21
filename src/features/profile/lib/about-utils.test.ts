import { splitAboutParagraphs } from "./about-utils";

describe("splitAboutParagraphs", () => {
  it("splits paragraphs separated by double newlines", () => {
    expect(
      splitAboutParagraphs("First paragraph.\n\nSecond paragraph."),
    ).toEqual(["First paragraph.", "Second paragraph."]);
  });

  it("handles whitespace-only text", () => {
    expect(splitAboutParagraphs("   ")).toEqual([]);
  });

  it("handles empty text", () => {
    expect(splitAboutParagraphs("")).toEqual([]);
  });

  it("handles multiple empty lines between paragraphs", () => {
    expect(splitAboutParagraphs("Para one.\n\n\n\nPara two.")).toEqual([
      "Para one.",
      "Para two.",
    ]);
  });

  it("handles single paragraph without newlines", () => {
    expect(splitAboutParagraphs("Only one paragraph.")).toEqual([
      "Only one paragraph.",
    ]);
  });
});
