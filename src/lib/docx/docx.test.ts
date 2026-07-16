import JSZip from "jszip";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseDocx } from "./parser";
import { rebuildDocx } from "./rebuilder";
import type { AdaptedSection } from "@/lib/types";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const LIST_PARAGRAPH_PATTERN =
  /<w:p>\s*<w:pPr><w:pStyle w:val="ListParagraph"\/><\/w:pPr>[\s\S]*?<\/w:p>/;

function wrapDocumentXml(bodyContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W_NS}">
  <w:body>
    ${bodyContent}
    <w:sectPr/>
  </w:body>
</w:document>`;
}

async function buildMinimalDocx(bodyContent: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("word/document.xml", wrapDocumentXml(bodyContent));
  return zip.generateAsync({ type: "nodebuffer" });
}

function extractWtTexts(xml: string): string[] {
  const matches = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  return matches.map((m) => {
    const text = m[1] ?? "";
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  });
}

function buildAdaptedSections(
  original: Awaited<ReturnType<typeof parseDocx>>,
  textByParaId: Record<string, string[]>,
): AdaptedSection[] {
  return original.sections.map((section) => ({
    id: section.id,
    paragraphs: section.paragraphs.map((para) => ({
      id: para.id,
      runs: (textByParaId[para.id] ?? para.runs.map((r) => r.text)).map(
        (text, i) => ({
          id: para.runs[i]?.id ?? `${para.id}-run-${i}`,
          text,
        }),
      ),
    })),
  }));
}

async function rebuildAndReadXml(
  parsed: Awaited<ReturnType<typeof parseDocx>>,
  adapted: AdaptedSection[],
): Promise<string> {
  const output = await rebuildDocx(
    parsed.zipFiles,
    parsed.rawXml,
    parsed.sections,
    adapted,
  );
  const zip = await JSZip.loadAsync(output);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("rebuilt docx missing document.xml");
  return xml;
}

describe("docx parser + rebuilder regressions", () => {
  it("extracts text when w:t is forced into an array (fix 1)", async () => {
    const buffer = await buildMinimalDocx(`
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:t>Skills</w:t></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
        <w:r><w:t>Built scalable APIs with TypeScript and Node.js for production.</w:t></w:r>
      </w:p>
    `);

    const parsed = await parseDocx(buffer);

    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(parsed.sections[0]?.paragraphs[0]?.runs[0]?.text).toContain(
      "TypeScript",
    );
  });

  it("preserves spaces between spell-check split runs (fix 2)", async () => {
    const buffer = await buildMinimalDocx(`
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:t>Skills</w:t></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
        <w:r><w:t>Built apps </w:t></w:r>
        <w:r><w:t>to </w:t></w:r>
        <w:r><w:t>React+TS </w:t></w:r>
        <w:r><w:t>and </w:t></w:r>
        <w:r><w:t>Node.js</w:t></w:r>
      </w:p>
    `);

    const parsed = await parseDocx(buffer);
    const para = parsed.sections[0]?.paragraphs[0];
    expect(para).toBeDefined();
    if (!para) return;

    const joined = para.runs.map((r) => r.text).join("");
    expect(joined).toBe("Built apps to React+TS and Node.js");

    const adapted = buildAdaptedSections(parsed, {
      [para.id]: ["Built apps ", "to ", "React+TS ", "and ", "Node.js"],
    });
    const xml = await rebuildAndReadXml(parsed, adapted);
    const listParaMatch = LIST_PARAGRAPH_PATTERN.exec(xml);
    const listParaXml = listParaMatch?.[0] ?? "";
    const rebuiltText = extractWtTexts(listParaXml).join("");
    expect(rebuiltText).toBe("Built apps to React+TS and Node.js");
    expect(rebuiltText).not.toContain("toReact+TSand");
  });

  it("skips decorative runs without w:t so run indices stay aligned (fix 3)", async () => {
    const buffer = await buildMinimalDocx(`
      <w:p>
        <w:pPr><w:pStyle w:val="CustomTitle"/></w:pPr>
        <w:r><w:br/></w:r>
        <w:r><w:t>Software Engineer</w:t></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
        <w:r><w:t>Delivered platform improvements across multiple product teams.</w:t></w:r>
      </w:p>
    `);

    const parsed = await parseDocx(buffer);
    const titlePara = parsed.sections[0]?.paragraphs.find((p) =>
      p.runs.some((r) => r.text.includes("Software Engineer")),
    );
    expect(titlePara).toBeDefined();
    if (!titlePara) return;

    const adapted = buildAdaptedSections(parsed, {
      [titlePara.id]: ["Senior Software Engineer"],
    });
    const xml = await rebuildAndReadXml(parsed, adapted);
    expect(xml).toContain("Senior Software Engineer");
    expect(xml).not.toContain(">EngineerSenior<");
  });

  it("maps global xmlIndex including table paragraphs (layout tables)", async () => {
    const sidebarText = "Sidebar contact info stays untouched";
    const adaptableText =
      "Led migration to microservices architecture for the platform team.";

    const buffer = await buildMinimalDocx(`
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:t>Experience</w:t></w:r>
      </w:p>
      <w:tbl>
        <w:tr>
          <w:tc>
            <w:p><w:r><w:t>${sidebarText}</w:t></w:r></w:p>
          </w:tc>
          <w:tc>
            <w:p><w:r><w:t>Inner column text</w:t></w:r></w:p>
          </w:tc>
        </w:tr>
      </w:tbl>
      <w:p>
        <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
        <w:r><w:t>${adaptableText}</w:t></w:r>
      </w:p>
    `);

    const parsed = await parseDocx(buffer);
    const adaptablePara = parsed.sections[0]?.paragraphs[0];
    expect(adaptablePara).toBeDefined();
    if (!adaptablePara) return;
    expect(adaptablePara.xmlIndex).toBe(3);

    const adaptedText =
      "Led cloud-native migration to microservices for the platform organization.";
    const adapted = buildAdaptedSections(parsed, {
      [adaptablePara.id]: [adaptedText],
    });
    const xml = await rebuildAndReadXml(parsed, adapted);

    expect(xml).toContain(sidebarText);
    expect(xml).toContain(adaptedText);
    expect(xml).not.toContain(adaptableText);
  });

  it("includes About Me paragraphs inside layout tables", async () => {
    const aboutMe =
      "Full-stack developer with eight years of experience building scalable web platforms and APIs.";

    const buffer = await buildMinimalDocx(`
      <w:tbl>
        <w:tr>
          <w:tc>
            <w:p>
              <w:pPr><w:pStyle w:val="Textoindependiente"/></w:pPr>
              <w:r><w:t>${aboutMe}</w:t></w:r>
            </w:p>
          </w:tc>
        </w:tr>
      </w:tbl>
    `);

    const parsed = await parseDocx(buffer);
    expect(parsed.sections.length).toBeGreaterThan(0);
    const aboutPara = parsed.sections[0]?.paragraphs[0];
    expect(aboutPara?.xmlIndex).toBe(0);
    expect(aboutPara?.runs[0]?.text).toContain("Full-stack developer");
  });

  it("does not duplicate xml:space when text already has preserve (fix 5)", async () => {
    const buffer = await buildMinimalDocx(`
      <w:p>
        <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
        <w:r><w:t xml:space="preserve">Original text </w:t></w:r>
      </w:p>
    `);

    const parsed = await parseDocx(buffer);
    const para = parsed.sections[0]?.paragraphs[0];
    expect(para).toBeDefined();
    if (!para) return;

    const adapted = buildAdaptedSections(parsed, {
      [para.id]: ["Adapted text "],
    });
    const xml = await rebuildAndReadXml(parsed, adapted);

    expect(xml).toContain('xml:space="preserve"');
    expect(xml).not.toMatch(/xml:space="preserve"\s+xml:space="preserve"/);
  });

  it("parses the bundled CV template with adaptable sections", async () => {
    const templatePath = path.join(
      process.cwd(),
      "src",
      "features",
      "resume-engine",
      "assets",
      "cv-template.docx",
    );
    const buffer = await readFile(templatePath);
    const parsed = await parseDocx(buffer);

    expect(parsed.sections.length).toBeGreaterThan(0);
    const totalParagraphs = parsed.sections.reduce(
      (sum, section) => sum + section.paragraphs.length,
      0,
    );
    expect(totalParagraphs).toBeGreaterThan(0);
  });
});
