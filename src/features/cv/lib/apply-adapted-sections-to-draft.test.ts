import { applyAdaptedSectionsToDraft } from "./apply-adapted-sections-to-draft";
import type { CvImportDraft } from "./cv-import-draft";
import type { AdaptedSection, CvSection } from "@/lib/types";

const draft: CvImportDraft = {
  detectedLocale: "en",
  header: {
    fullName: "Jane Doe",
    degree: "Software Engineer",
    summary: "Original summary.",
  },
  experiences: [
    {
      id: "exp-1",
      company: "Acme",
      role: "Engineer",
      responsibilities: ["Built APIs", "Wrote tests"],
      atsResponsibilities: [],
    },
  ],
  education: [],
  skills: [{ category: "BACKEND", items: ["Node.js"] }],
  languages: [],
  contacts: [],
  certifications: [],
};

const template: CvSection[] = [
  {
    id: "s-about",
    heading: "About me",
    paragraphs: [
      {
        id: "p0",
        style: "",
        xmlIndex: 0,
        runs: [{ id: "r0", text: "Original summary." }],
      },
    ],
  },
  {
    id: "s-exp",
    heading: "Experience",
    paragraphs: [
      {
        id: "p1",
        style: "",
        xmlIndex: 1,
        runs: [{ id: "r1", text: "Built APIs" }],
      },
      {
        id: "p2",
        style: "",
        xmlIndex: 2,
        runs: [{ id: "r2", text: "Wrote tests" }],
      },
    ],
  },
];

const adapted: AdaptedSection[] = [
  {
    id: "s-about",
    paragraphs: [
      {
        id: "p0",
        runs: [{ id: "r0", text: "Tailored summary for backend roles." }],
      },
    ],
  },
  {
    id: "s-exp",
    paragraphs: [
      { id: "p1", runs: [{ id: "r1", text: "Shipped REST APIs in Node.js" }] },
      { id: "p2", runs: [{ id: "r2", text: "Added integration tests" }] },
    ],
  },
];

describe("applyAdaptedSectionsToDraft", () => {
  it("overlays tailored about and experience text onto the draft", () => {
    const next = applyAdaptedSectionsToDraft(draft, template, adapted);
    expect(next.header.summary).toBe("Tailored summary for backend roles.");
    expect(next.experiences[0]?.responsibilities).toEqual([
      "Shipped REST APIs in Node.js",
      "Added integration tests",
    ]);
  });
});
