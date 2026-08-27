import type { Locale } from "@/i18n/config";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { LockedParagraph } from "@/lib/types";

import {
  syncLockedParagraphsFromDraft,
  withLockedMetaAdaptations,
  withLockedMetaSection,
} from "./sync-locked-paragraphs-from-draft";

const lockedFixture: LockedParagraph[] = [
  {
    kind: "experience-role",
    paragraph: {
      id: "locked-para-0",
      style: "",
      xmlIndex: 10,
      runs: [{ id: "locked-para-0-run-0", text: "Full-time | Old Role" }],
    },
  },
  {
    kind: "experience-meta",
    paragraph: {
      id: "locked-para-1",
      style: "Textoindependiente",
      xmlIndex: 11,
      runs: [
        {
          id: "locked-para-1-run-0",
          text: "OldCo · Remote · January 2020 – Present",
        },
      ],
    },
  },
  {
    kind: "education-dates",
    paragraph: {
      id: "locked-para-2",
      style: "Textoindependiente",
      xmlIndex: 3,
      runs: [{ id: "locked-para-2-run-0", text: "2010-2015" }],
    },
  },
];

const draft: CvImportDraft = {
  detectedLocale: "en",
  header: { fullName: "Jane Doe" },
  experiences: [
    {
      id: "exp-1",
      company: "NewCo",
      role: "Senior Engineer",
      location: "Hybrid",
      startDate: "2024-08",
      endDate: undefined,
      current: true,
      responsibilities: [],
      atsResponsibilities: [],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "UNI",
      degreeName: "CS",
      startYear: 2017,
      endYear: 2024,
    },
  ],
  skills: [],
  languages: [],
  contacts: [],
  certifications: [],
};

describe("syncLockedParagraphsFromDraft", () => {
  it("updates role, company/date meta, and education years from the draft", () => {
    const adapted = syncLockedParagraphsFromDraft(
      lockedFixture,
      draft,
      "en" satisfies Locale,
    );

    expect(adapted.map((paragraph) => paragraph.runs[0]?.text)).toEqual([
      "Full-time | Senior Engineer",
      "NewCo · Hybrid · August 2024 – Present",
      "2017-2024",
    ]);
  });

  it("preserves client annotation on company when draft company is a prefix", () => {
    const locked: LockedParagraph[] = [
      {
        kind: "experience-meta",
        paragraph: {
          id: "locked-para-1",
          style: "Textoindependiente",
          xmlIndex: 11,
          runs: [
            {
              id: "locked-para-1-run-0",
              text: "Imagemaker (Client: Walmart Global Tech) · Remote · August 2025 – Present",
            },
          ],
        },
      },
    ];

    const adapted = syncLockedParagraphsFromDraft(
      locked,
      {
        ...draft,
        experiences: [
          {
            id: "exp-1",
            company: "Imagemaker",
            role: "Senior Software Engineer",
            location: "Remote",
            startDate: "2025-09",
            current: true,
            responsibilities: [],
            atsResponsibilities: [],
          },
        ],
      },
      "en",
    );

    expect(adapted[0]?.runs[0]?.text).toBe(
      "Imagemaker (Client: Walmart Global Tech) · Remote · September 2025 – Present",
    );
  });

  it("merges locked paragraphs into rebuild section lists", () => {
    const sections = withLockedMetaSection([], lockedFixture);
    const adapted = withLockedMetaAdaptations(
      [],
      syncLockedParagraphsFromDraft(lockedFixture, draft, "es"),
    );

    expect(sections[0]?.paragraphs).toHaveLength(3);
    expect(adapted[0]?.paragraphs[1]?.runs[0]?.text).toContain("Agosto de 2024");
    expect(adapted[0]?.paragraphs[1]?.runs[0]?.text).toContain("Presente");
  });
});
