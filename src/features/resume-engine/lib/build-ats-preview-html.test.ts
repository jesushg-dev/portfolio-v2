import type { LocalizedCvData } from "@/components/curriculum-vitae/types";
import {
  ATS_PREVIEW_LABELS,
  buildAtsPreviewHtml,
} from "./build-ats-preview-html";

function data(overrides: Partial<LocalizedCvData> = {}): LocalizedCvData {
  return {
    header: {
      id: "hdr-1",
      fullName: "Ada <Lovelace>",
      photoUrl: null,
      backgroundImageUrl: null,
      degree: "Mathematician",
      clientImageAlt: "",
    },
    profile: { displayName: "Ada", username: "ada" },
    contacts: [
      {
        id: "c1",
        type: "EMAIL",
        value: "ada@example.com",
        order: 0,
        label: "Email",
      },
    ],
    educations: [
      {
        id: "edu-1",
        institution: "UNI",
        startYear: 2015,
        endYear: 2019,
        dates: null,
        order: 0,
        degreeName: "Math",
        location: "London",
      },
    ],
    languages: [{ id: "l1", order: 0, name: "English", level: "Native" }],
    technicalSkills: [
      { id: "s1", category: "FRONTEND", items: ["React"], order: 0 },
    ],
    experiences: [
      {
        id: "exp-1",
        company: "Acme",
        companyLogoUrl: null,
        startDate: new Date("2020-01-01"),
        endDate: null,
        current: true,
        order: 0,
        role: "Engineer",
        location: "Remote",
        companyBlurb: "Widgets",
        responsibilities: [{ id: "r1", order: 0, text: "Shipped UI" }],
        skills: ["React"],
      },
    ],
    softSkills: [{ id: "ss-1", order: 0, name: "Empathy" }],
    additionalInformation: [{ id: "a1", order: 0, text: "Open source" }],
    personalReferences: [
      {
        id: "pr-1",
        order: 0,
        name: "Grace",
        contact: "grace@example.com",
        role: "Manager",
      },
    ],
    certifications: [
      { id: "cert-1", title: "AWS", issuer: "Amazon", year: 2024 },
    ],
    ...overrides,
  };
}

describe("buildAtsPreviewHtml", () => {
  it("escapes HTML and includes the main CV sections", () => {
    const html = buildAtsPreviewHtml({
      data: data(),
      aboutMeText: "I build <computers>.",
      labels: ATS_PREVIEW_LABELS.en,
    });

    expect(html).toContain("Ada &lt;Lovelace&gt;");
    expect(html).toContain("I build &lt;computers&gt;.");
    expect(html).toContain("Experience");
    expect(html).toContain("Acme");
    expect(html).toContain("Present");
    expect(html).toContain("Front-end");
    expect(html).toContain("Math");
    expect(html).toContain("English");
    expect(html).toContain("Empathy");
    expect(html).toContain("Open source");
    expect(html).toContain("Grace");
    expect(html).toContain("AWS");
  });

  it("falls back to the profile name and skips empty sections", () => {
    const html = buildAtsPreviewHtml({
      data: data({
        header: null,
        contacts: [],
        experiences: [],
        educations: [],
        languages: [],
        technicalSkills: [],
        softSkills: [],
        additionalInformation: [],
        personalReferences: [],
        certifications: [],
      }),
      aboutMeText: null,
      labels: ATS_PREVIEW_LABELS.es,
    });

    expect(html).toContain("Ada");
    expect(html).not.toContain("Sobre mí");
    expect(html).not.toContain("Experiencia");
  });
});
