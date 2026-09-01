import { mapDraftToLocalizedCv } from "./map-draft-to-localized";
import type { CvImportDraft } from "./cv-import-draft";

const draft: CvImportDraft = {
  detectedLocale: "en",
  header: {
    fullName: "Jane Doe",
    degree: "Software Engineer",
    summary: "Builds APIs.",
  },
  experiences: [
    {
      id: "exp-1",
      company: "Acme",
      role: "Engineer",
      startDate: "2020-01",
      current: true,
      responsibilities: ["Shipped APIs"],
      atsResponsibilities: [],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "UNI",
      degreeName: "CS",
      startYear: 2016,
      endYear: 2020,
    },
  ],
  skills: [{ category: "BACKEND", items: ["Node.js"] }],
  languages: [{ name: "English", level: "Native" }],
  contacts: [{ type: "EMAIL", value: "jane@example.com" }],
  certifications: [{ title: "AWS SAA", issuer: "Amazon", year: 2024 }],
};

describe("mapDraftToLocalizedCv", () => {
  it("maps draft fields into LocalizedCvData for ATS preview", () => {
    const { data, aboutMeText } = mapDraftToLocalizedCv(draft);
    expect(aboutMeText).toBe("Builds APIs.");
    expect(data.header?.fullName).toBe("Jane Doe");
    expect(data.experiences[0]?.company).toBe("Acme");
    expect(data.certifications[0]?.title).toBe("AWS SAA");
    expect(data.contacts[0]?.value).toBe("jane@example.com");
  });
});
