import {
  extractParagraphXmlParts,
  splitIntoParagraphs,
} from "./split-paragraphs";

const xml =
  '<w:body><w:p w:rsidR="1"><w:r><w:t>Hello</w:t></w:r></w:p><w:p><w:r><w:t>World</w:t></w:r></w:p></w:body>';

describe("splitIntoParagraphs", () => {
  it("keeps separators around paragraph blocks", () => {
    const parts = splitIntoParagraphs(xml);
    expect(parts.some((part) => part.startsWith("<w:p"))).toBe(true);
    expect(parts[0]).toBe("<w:body>");
  });
});

describe("extractParagraphXmlParts", () => {
  it("returns only paragraph XML", () => {
    const paragraphs = extractParagraphXmlParts(xml);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs.every((part) => part.startsWith("<w:p"))).toBe(true);
  });
});
