import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractParagraphXmlParts } from "./split-paragraphs";

describe("Inspect all headings and paragraphs in template", () => {
  it("prints all paragraphs with text and styles", async () => {
    const templatePath = path.join(
      process.cwd(),
      "src",
      "features",
      "resume-engine",
      "assets",
      "cv-template.docx",
    );
    const buffer = await readFile(templatePath);
    const zip = await JSZip.loadAsync(buffer);
    const rawXml = await zip.file("word/document.xml")!.async("string");

    const paras = extractParagraphXmlParts(rawXml);
    const list: {
      idx: number;
      style: string;
      text: string;
      hasHyperlink: boolean;
    }[] = [];

    paras.forEach((pXml, idx) => {
      const styleMatch = /<w:pStyle\b[^>]*\bw:val="([^"]+)"/.exec(pXml);
      const style = styleMatch ? styleMatch[1] : "";
      const wtMatches = [
        ...pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g),
      ];
      const text = wtMatches.map((m) => m[1] ?? "").join("");
      const hasHyperlink = pXml.includes("<w:hyperlink");

      if (text.trim().length > 0) {
        list.push({ idx, style, text: text.trim().slice(0, 60), hasHyperlink });
      }
    });

    console.log("Total with text:", list.length);
    console.log(
      "Headings & styles sample:",
      list.filter(
        (item) =>
          item.style.includes("Heading") ||
          item.style.includes("Title") ||
          item.style.includes("Ttulo") ||
          (item.text.toUpperCase() === item.text && item.text.length < 30),
      ),
    );
    console.log(
      "Hyperlink paragraphs:",
      list.filter((item) => item.hasHyperlink),
    );
  });
});
