import {
  certificationYear,
  loadCvStructuredDraft,
} from "./load-cv-structured-draft";

it.each([
  [2024, 2024],
  [1688191200000, 2023],
  [null, undefined],
] as const)("normalizes certificate date %s to year %s", (value, expected) =>
  expect(certificationYear(value)).toBe(expected),
);

const languages = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
];

describe("loadCvStructuredDraft", () => {
  it("returns null when there is no header", async () => {
    const db = {
      appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
      cvHeader: { findUnique: jest.fn().mockResolvedValue(null) },
      profile: { findUnique: jest.fn().mockResolvedValue(null) },
      cvExperience: { findMany: jest.fn().mockResolvedValue([]) },
      cvEducation: { findMany: jest.fn().mockResolvedValue([]) },
      cvTechnicalSkill: { findMany: jest.fn().mockResolvedValue([]) },
      cvContact: { findMany: jest.fn().mockResolvedValue([]) },
      cvLanguage: { findMany: jest.fn().mockResolvedValue([]) },
      certification: { findMany: jest.fn().mockResolvedValue([]) },
    };

    await expect(
      loadCvStructuredDraft(db as never, "user-1", { locale: "en" }),
    ).resolves.toBeNull();
  });

  it("maps header, experiences, education, and certifications", async () => {
    const db = {
      appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
      cvHeader: {
        findUnique: jest.fn().mockResolvedValue({
          fullName: "Ada Lovelace",
          translations: [
            {
              appLanguageId: "lang-en",
              degree: "Math",
              heroSummary: "Public hero copy that must never enter the CV",
            },
          ],
        }),
      },
      profile: {
        findUnique: jest.fn().mockResolvedValue({ defaultLocale: "en" }),
      },
      cvAboutMe: {
        findUnique: jest.fn().mockResolvedValue({
          translations: [{ appLanguageId: "lang-en", aboutMe: "Builder" }],
        }),
      },
      cvExperience: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "exp-1",
            company: "Acme",
            current: false,
            startDate: new Date("2020-01-01"),
            endDate: new Date("2021-01-01"),
            translations: [
              {
                appLanguageId: "lang-en",
                role: "Engineer",
                location: "Remote",
                companyBlurb: "Widgets",
              },
            ],
            responsibilities: [
              {
                id: "achievement-visible",
                atsOnly: false,
                translations: [
                  { appLanguageId: "lang-en", text: "Shipped UI" },
                ],
              },
              {
                id: "achievement-additional",
                atsOnly: true,
                translations: [{ appLanguageId: "lang-en", text: "ATS only" }],
              },
            ],
          },
        ]),
      },
      cvEducation: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "edu-1",
            institution: "UNI",
            startYear: 2015,
            endYear: 2019,
            dates: null,
            translations: [
              {
                appLanguageId: "lang-en",
                degreeName: "BSc",
                location: "London",
              },
            ],
          },
        ]),
      },
      cvTechnicalSkill: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "group-1",
            category: "FRONTEND",
            order: 0,
            selections: [
              {
                skillId: "skill-react",
                skill: { userId: "user-1", title: "React" },
              },
            ],
          },
        ]),
      },
      cvContact: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ type: "EMAIL", value: "ada@example.com" }]),
      },
      cvLanguage: {
        findMany: jest.fn().mockResolvedValue([
          {
            translations: [
              { appLanguageId: "lang-en", name: "English", level: "Native" },
            ],
          },
        ]),
      },
      certification: {
        findMany: jest.fn().mockResolvedValue([
          {
            company: "AWS",
            issuedDate: 2024,
            CertificationTranslation: [
              { appLanguageId: "lang-en", title: "Solutions Architect" },
            ],
          },
        ]),
      },
    };

    const draft = await loadCvStructuredDraft(db as never, "user-1", {
      locale: "en",
    });
    expect(draft?.header.fullName).toBe("Ada Lovelace");
    expect(draft?.header.summary).toBe("Builder");
    expect(draft?.experiences[0]?.responsibilities).toEqual(["Shipped UI"]);
    expect(draft?.experiences[0]?.atsResponsibilities).toEqual(["ATS only"]);
    expect(draft?.experiences[0]?.employmentType).toBe("FULL_TIME");
    expect(draft?.education[0]?.degreeName).toBe("BSc");
    expect(draft?.certifications[0]?.title).toBe("Solutions Architect");
    expect(draft?.skills).toEqual([{ category: "FRONTEND", items: ["React"] }]);
    const tailored = await loadCvStructuredDraft(db as never, "user-1", {
      locale: "en",
      evidenceScope: "all",
    });
    expect(tailored?.experiences[0].responsibilities).toEqual([
      "Shipped UI",
      "ATS only",
    ]);
    expect(tailored?.experiences[0].responsibilityIds).toEqual([
      "achievement-visible",
      "achievement-additional",
    ]);
    expect(tailored?.experiences[0].atsResponsibilities).toEqual([]);
  });

  it("does not automatically include unselected portfolio skills", async () => {
    const db = {
      appLanguage: {
        findMany: jest.fn().mockResolvedValue([{ id: "lang-en", code: "en" }]),
      },
      cvHeader: {
        findUnique: jest.fn().mockResolvedValue({
          fullName: "Dev User",
          translations: [{ appLanguageId: "lang-en", degree: "Engineer" }],
        }),
      },
      profile: {
        findUnique: jest.fn().mockResolvedValue({ defaultLocale: "en" }),
      },
      cvAboutMe: { findUnique: jest.fn().mockResolvedValue(null) },
      cvExperience: { findMany: jest.fn().mockResolvedValue([]) },
      cvEducation: { findMany: jest.fn().mockResolvedValue([]) },
      cvTechnicalSkill: { findMany: jest.fn().mockResolvedValue([]) },
      skill: {
        findMany: jest.fn().mockResolvedValue([
          { title: "React", type: "FRONTEND", featured: true },
          { title: "Node.js", type: "BACKEND", featured: false },
          { title: "PostgreSQL", type: "DATA", featured: false },
        ]),
      },
      cvContact: { findMany: jest.fn().mockResolvedValue([]) },
      cvLanguage: { findMany: jest.fn().mockResolvedValue([]) },
      certification: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const draft = await loadCvStructuredDraft(db as never, "user-1", {
      locale: "en",
    });

    expect(draft?.skills).toEqual([]);
  });
});
