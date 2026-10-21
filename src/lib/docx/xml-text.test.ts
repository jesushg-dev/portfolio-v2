import { coalesceXmlText, extractTextFromWt } from "./xml-text";

describe("coalesceXmlText", () => {
  it("returns strings as-is", () => {
    expect(coalesceXmlText("hello")).toBe("hello");
  });

  it("converts numbers to string", () => {
    expect(coalesceXmlText(123)).toBe("123");
    expect(coalesceXmlText(0)).toBe("0");
  });

  it("converts booleans to string", () => {
    expect(coalesceXmlText(true)).toBe("true");
    expect(coalesceXmlText(false)).toBe("false");
  });

  it("returns empty string for null, undefined, objects, symbols, etc.", () => {
    expect(coalesceXmlText(null)).toBe("");
    expect(coalesceXmlText(undefined)).toBe("");
    expect(coalesceXmlText({})).toBe("");
    expect(coalesceXmlText([])).toBe("");
  });
});

describe("extractTextFromWt", () => {
  it("returns empty string for null or undefined", () => {
    expect(extractTextFromWt(undefined)).toBe("");
    expect(extractTextFromWt(null)).toBe("");
  });

  it("extracts text from plain string or array of strings", () => {
    expect(extractTextFromWt("hello")).toBe("hello");
    expect(extractTextFromWt(["hello", " ", "world"])).toBe("hello world");
  });

  it("extracts text from objects with #text property", () => {
    expect(extractTextFromWt({ "#text": "sample" })).toBe("sample");
    expect(
      extractTextFromWt([{ "#text": "part1" }, { "#text": "part2" }]),
    ).toBe("part1part2");
  });

  it("handles mixed types including digit-only w:t nodes coerced to numbers", () => {
    // fast-xml-parser turns <w:t>2024</w:t> into the number 2024
    expect(extractTextFromWt(["str", { "#text": 42 }, 99, null])).toBe(
      "str4299",
    );
    expect(extractTextFromWt(["202", 4])).toBe("2024");
  });
});
