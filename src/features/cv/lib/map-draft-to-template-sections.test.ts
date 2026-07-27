import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { CvSection } from "@/lib/types";

import { mapDraftToTemplateSections } from "./map-draft-to-template-sections";

const templateSections: CvSection[] = [
  {
    id: "section-0",
    heading: "Header",
    paragraphs: [
      {
        id: "section-0-para-0",
        style: "Title",
        xmlIndex: 0,
        runs: [{ id: "section-0-para-0-run-0", text: "Old title" }],
      },
    ],
  },
  {
    id: "section-4",
    heading: "ABOUT ME",
    paragraphs: [
      {
        id: "section-4-para-0",
        style: "ListParagraph",
        xmlIndex: 1,
        runs: [{ id: "section-4-para-0-run-0", text: "Old about 1" }],
      },
      {
        id: "section-4-para-1",
        style: "ListParagraph",
        xmlIndex: 2,
        runs: [{ id: "section-4-para-1-run-0", text: "Old about 2" }],
      },
    ],
  },
  {
    id: "section-5",
    heading: "PROFESSIONAL EXPERIENCE",
    paragraphs: [
      {
        id: "section-5-para-0",
        style: "ListParagraph",
        xmlIndex: 3,
        runs: [{ id: "section-5-para-0-run-0", text: "Old bullet 1" }],
      },
      {
        id: "section-5-para-1",
        style: "ListParagraph",
        xmlIndex: 4,
        runs: [{ id: "section-5-para-1-run-0", text: "Old bullet 2" }],
      },
    ],
  },
  {
    id: "section-6",
    heading: "SOFT SKILLS",
    paragraphs: [
      {
        id: "section-6-para-0",
        style: "ListParagraph",
        xmlIndex: 5,
        runs: [{ id: "section-6-para-0-run-0", text: "Old skill 1" }],
      },
    ],
  },
];

const draft: CvImportDraft = {
  detectedLocale: "en",
  header: {
    fullName: "Jane Doe",
    degree: "Software Engineer",
    summary:
      "First sentence about Jane. Second sentence with more detail. Third sentence for overflow.",
  },
  experiences: [
    {
      id: "exp-1",
      company: "Acme",
      role: "Developer",
      responsibilities: ["Built APIs.", "Led migrations."],
    },
  ],
  education: [],
  skills: [],
  languages: [],
  contacts: [],
  certifications: [],
};

describe("mapDraftToTemplateSections", () => {
  it("maps header, about, experience bullets, and soft skills into template slots", () => {
    const adapted = mapDraftToTemplateSections(templateSections, draft, [
      "Team leadership",
    ]);

    expect(
      adapted.find((section) => section.id === "section-0")?.paragraphs[0]
        ?.runs[0]?.text,
    ).toBe("Software Engineer");

    expect(
      adapted
        .find((section) => section.id === "section-4")
        ?.paragraphs.map((paragraph) => paragraph.runs[0]?.text),
    ).toEqual([
      "First sentence about Jane. Second sentence with more detail.",
      "Third sentence for overflow.",
    ]);

    expect(
      adapted
        .find((section) => section.id === "section-5")
        ?.paragraphs.map((paragraph) => paragraph.runs[0]?.text),
    ).toEqual(["Built APIs.", "Led migrations."]);

    expect(
      adapted.find((section) => section.id === "section-6")?.paragraphs[0]
        ?.runs[0]?.text,
    ).toBe("Team leadership");
  });
});
