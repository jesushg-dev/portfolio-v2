jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
    },
  })),
}));

import JSZip from "jszip";
import { loadCvTemplateForTailor } from "@/features/cv/lib/load-cv-template-docx";
import { tailorDocxResume } from "./tailor-docx";
import { rebuildDocx } from "@/lib/docx/rebuilder";
import { processJobDescription } from "./clean-job-description";
import { fitsLike } from "../pdf/fits-like";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import { PDFDocument } from "pdf-lib";
import type { TenantAiCredentials } from "./providers";

// Mock AI SDKs
const mockAnthropicCreate = jest.fn();
jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: (...args: unknown[]): Promise<unknown> =>
        Promise.resolve(mockAnthropicCreate(...args) as unknown),
    },
  }));
});

const mockOpenAiCreate = jest.fn();
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args: unknown[]): Promise<unknown> =>
          Promise.resolve(mockOpenAiCreate(...args) as unknown),
      },
    },
  }));
});

describe("Tailor DOCX Pipeline Integration Tests", () => {
  const dummyDraft: CvImportDraft = {
    detectedLocale: "en",
    header: { fullName: "Jesus Hernandez" },
    experiences: [
      {
        id: "exp-1",
        company: "Tech Corp",
        role: "Software Engineer",
        startDate: "2020-01",
        current: true,
        responsibilities: [
          "Developed web apps using React and TypeScript.",
          "Maintained backend APIs with Node.js.",
        ],
        atsResponsibilities: [],
      },
      {
        id: "exp-2",
        company: "Old Co",
        role: "Junior Developer",
        startDate: "2018-01",
        endDate: "2019-12",
        current: false,
        responsibilities: ["Built UI components."],
        atsResponsibilities: [],
      },
    ],
    education: [],
    skills: [
      { category: "FRONTEND", items: ["React", "TypeScript", "Node.js"] },
    ],
    languages: [],
    contacts: [],
    certifications: [],
  };

  const sampleJd =
    "We need a Senior React Developer experienced in TypeScript and Tailwind.";
  const testCredentials: TenantAiCredentials = {
    defaultProvider: "claude",
    keys: { claude: "test-key" },
  };

  function makeLlmResponse(edits: { id: string; text: string }[]) {
    return JSON.stringify({
      detectedLocale: "en",
      aiScore: 85,
      matchNotes: "Good alignment with requirements",
      edits,
      matchAnalysis: {
        score: 85,
        summary: "Good match",
        matchedKeywords: [],
        missingKeywords: [],
      },
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Scenario 2: LLM creates new runs or alters IDs -> invalid IDs are ignored", async () => {
    const { parsed } = await loadCvTemplateForTailor();

    mockAnthropicCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: makeLlmResponse([
            {
              id: "non-existent-hallucinated-id-999",
              text: "Invented text for non-existent run",
            },
          ]),
        },
      ],
    });

    const { result } = await tailorDocxResume(
      parsed.sections,
      sampleJd,
      testCredentials,
      "claude",
      dummyDraft,
    );

    expect(
      result.edits.find((e) => e.id === "non-existent-hallucinated-id-999"),
    ).toBeUndefined();
  });

  it("Scenario 3: LLM returns run exceeding budget -> shrink repaired or fallback empties oldest bullet", async () => {
    const { parsed } = await loadCvTemplateForTailor();
    const targetRun = parsed.sections[0].paragraphs[0].runs[0];

    // Return an edit way above character budget
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: makeLlmResponse([
            {
              id: targetRun.id,
              text: "A".repeat(400),
            },
          ]),
        },
      ],
    });

    // Shrink mock returns valid short text
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            runs: [
              {
                id: targetRun.id,
                text: "Short fitted text.",
              },
            ],
          }),
        },
      ],
    });

    const { result } = await tailorDocxResume(
      parsed.sections,
      sampleJd,
      testCredentials,
      "claude",
      dummyDraft,
    );

    const edited = result.edits.find((e) => e.id === targetRun.id);
    expect(edited?.text).toBe("Short fitted text.");
  });

  it("Scenario 4: LLM returns empty edits -> original texts are completely preserved", async () => {
    const { parsed } = await loadCvTemplateForTailor();
    const firstRun = parsed.sections[0].paragraphs[0].runs[0];

    mockAnthropicCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: makeLlmResponse([]),
        },
      ],
    });

    const { result } = await tailorDocxResume(
      parsed.sections,
      sampleJd,
      testCredentials,
      "claude",
      dummyDraft,
    );

    expect(result.sections[0].paragraphs[0].runs[0].text).toBe(firstRun.text);
  });

  it("Scenario 5: LLM attempts to alter locked run -> reverted to original", async () => {
    const { parsed } = await loadCvTemplateForTailor();
    const lockedRun = parsed.sections[0].paragraphs[0].runs[0];
    lockedRun.locked = true;

    mockAnthropicCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: makeLlmResponse([
            {
              id: lockedRun.id,
              text: "Manipulated locked text",
            },
          ]),
        },
      ],
    });

    const { result } = await tailorDocxResume(
      parsed.sections,
      sampleJd,
      testCredentials,
      "claude",
      dummyDraft,
    );

    const sectionRun = result.sections[0].paragraphs[0].runs.find(
      (r) => r.id === lockedRun.id,
    );
    expect(sectionRun?.text).toBe(lockedRun.text);
    expect(result.sourceWarnings?.some((w) => w.includes("E1"))).toBe(true);
    lockedRun.locked = false; // reset
  });

  it("Scenario 6: LLM invents metrics not present in source -> reverted", async () => {
    const { parsed } = await loadCvTemplateForTailor();
    const expSection = parsed.sections.find((s) =>
      /experience|experiencia|ervaring/i.test(s.heading),
    );
    const targetRun = expSection!.paragraphs[0].runs[0];
    const originalText = targetRun.text;

    mockAnthropicCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: makeLlmResponse([
            {
              id: targetRun.id,
              text: "Increased conversion rate by 95% and reduced latency by 30%.",
            },
          ]),
        },
      ],
    });

    const { result } = await tailorDocxResume(
      parsed.sections,
      sampleJd,
      testCredentials,
      "claude",
      dummyDraft,
    );

    const sectionRun = result.sections
      .flatMap((s) => s.paragraphs)
      .flatMap((p) => p.runs)
      .find((r) => r.id === targetRun.id);
    expect(sectionRun?.text).toBe(originalText);
    expect(result.sourceWarnings?.some((w) => w.includes("E4"))).toBe(true);
  });

  it("Scenario 7: fitsLike validates layout against original PDF", async () => {
    const origDoc = await PDFDocument.create();
    origDoc.addPage([595.28, 841.89]);
    const origBytes = await origDoc.save();

    const resDoc = await PDFDocument.create();
    resDoc.addPage([595.28, 841.89]);
    const resBytes = await resDoc.save();

    const fitResult = await fitsLike(
      Buffer.from(origBytes),
      Buffer.from(resBytes),
    );
    expect(fitResult.ok).toBe(true);

    const twoPageDoc = await PDFDocument.create();
    twoPageDoc.addPage([595.28, 841.89]);
    twoPageDoc.addPage([595.28, 841.89]);
    const twoPageBytes = await twoPageDoc.save();

    const unfitResult = await fitsLike(
      Buffer.from(origBytes),
      Buffer.from(twoPageBytes),
    );
    expect(unfitResult.ok).toBe(false);
  });

  it("Scenario 8: Emojis and markdown formatting in edits are stripped", async () => {
    const { parsed } = await loadCvTemplateForTailor();
    const targetRun = parsed.sections[0].paragraphs[0].runs[0];
    // Budget is Math.ceil(1.2 * 19) = 23

    mockAnthropicCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: makeLlmResponse([
            {
              id: targetRun.id,
              text: "🚀 **React** Dev",
            },
          ]),
        },
      ],
    });

    const { result } = await tailorDocxResume(
      parsed.sections,
      sampleJd,
      testCredentials,
      "claude",
      dummyDraft,
    );

    const edited = result.edits.find((e) => e.id === targetRun.id);
    expect(edited?.text).not.toContain("🚀");
    expect(edited?.text).not.toContain("**");
    expect(edited?.text).toBe("React Dev");
  });

  it("Scenario 9: JD with HTML, control chars, and boilerplate is cleaned", () => {
    const dirtyJd = `
      <div>
        <h1>Software Engineer</h1>
        <p>Looking for a React\u200B developer \u0007with Node.js.</p>
        <section>
          EEO statement: We are an equal opportunity employer and do not discriminate...
        </section>
      </div>
    `;

    const { cleanedText, wasSanitized } = processJobDescription(dirtyJd);
    expect(wasSanitized).toBe(true);
    expect(cleanedText).not.toContain("<div>");
    expect(cleanedText).not.toContain("\u200B");
    expect(cleanedText).not.toContain("\u0007");
  });

  it("Rebuilds DOCX successfully with tailored sections", async () => {
    const { buffer: templateBuffer, parsed } = await loadCvTemplateForTailor();
    const zip = await JSZip.loadAsync(templateBuffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    mockAnthropicCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: makeLlmResponse([
            {
              id: parsed.sections[0].paragraphs[0].runs[0].id,
              text: "React Developer",
            },
          ]),
        },
      ],
    });

    const { result } = await tailorDocxResume(
      parsed.sections,
      sampleJd,
      testCredentials,
      "claude",
      dummyDraft,
    );

    const rebuilt = await rebuildDocx(
      zip,
      docXml,
      parsed.sections,
      result.sections,
    );
    expect(rebuilt).toBeInstanceOf(Buffer);
    expect(rebuilt.length).toBeGreaterThan(1000);

    const rebuiltZip = await JSZip.loadAsync(rebuilt);
    const rebuiltXml = await rebuiltZip
      .file("word/document.xml")!
      .async("string");
    expect(rebuiltXml).toContain("React Developer");
  });
});
