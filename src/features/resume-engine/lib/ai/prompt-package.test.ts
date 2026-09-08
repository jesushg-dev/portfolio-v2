import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { CvSection } from "@/lib/types";
import {
  buildCombinedPrompt,
  buildDocxTailorPromptPackage,
  buildImportPromptPackage,
  buildShrinkPromptPackage,
  buildStudioDocxTailorPromptPackage,
  buildTailorPromptPackage,
} from "./prompt-package";

const draft: CvImportDraft = {
  detectedLocale: "en",
  header: { fullName: "Ada" },
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  contacts: [],
  certifications: [],
};

const sections: CvSection[] = [
  {
    id: "s1",
    heading: "Experience",
    paragraphs: [
      {
        id: "p1",
        style: "ListParagraph",
        xmlIndex: 0,
        runs: [{ id: "r1", text: "Shipped UI with React" }],
      },
      {
        id: "p2",
        style: "Title",
        xmlIndex: 1,
        runs: [{ id: "r2", text: "Engineer" }],
      },
    ],
  },
];

describe("resume-engine prompt packages", () => {
  it("builds a combined system/user prompt", () => {
    expect(buildCombinedPrompt("sys", "user")).toContain("SYSTEM:");
    expect(buildCombinedPrompt("sys", "user")).toContain("USER:");
  });

  it("includes resume sections in the import package", () => {
    const pkg = buildImportPromptPackage([
      { heading: "Experience", lines: ["Acme"] },
    ]);
    expect(pkg.userPrompt).toContain("RESUME SECTIONS");
    expect(pkg.combinedPrompt).toContain(pkg.systemPrompt);
  });

  it("includes the structured draft in the tailor package", () => {
    const pkg = buildTailorPromptPackage(draft, "Need a React engineer.");
    expect(pkg.userPrompt).toContain("Ada");
    expect(pkg.userPrompt).toContain("Need a React engineer.");
  });

  it("adds a character budget to non-title runs in docx tailor prompts", () => {
    const pkg = buildDocxTailorPromptPackage(sections, "Need React.");
    expect(pkg.userPrompt).toContain("budget");
    expect(pkg.userPrompt).toContain("Need React.");

    const studio = buildStudioDocxTailorPromptPackage(
      sections,
      draft,
      "Need React.",
    );
    expect(studio.userPrompt).toContain("STRUCTURED RESUME DATA");
  });

  it("builds a shrink package for overflowing fragments", () => {
    const pkg = buildShrinkPromptPackage([
      { id: "r1", text: "A very long bullet", budget: 12 },
    ]);
    expect(pkg.userPrompt).toContain("FRAGMENTS TO SHORTEN");
  });
});
