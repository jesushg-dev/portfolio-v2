import { persistCvImportDraft } from "./import-persist";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";

const draft: CvImportDraft = {
  detectedLocale: "en",
  header: {
    fullName: "Ada Lovelace",
    degree: "Mathematics",
    summary: "I build computers.",
  },
  experiences: [
    {
      id: "exp-1",
      company: "Acme",
      role: "Engineer",
      location: "Remote",
      startDate: "2020",
      endDate: "2021-06-01",
      current: false,
      responsibilities: ["Shipped UI"],
      atsResponsibilities: [],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "UNI",
      degreeName: "Math",
      location: "London",
      startYear: 2015,
      endYear: 2019,
    },
  ],
  skills: [{ category: "FRONTEND", items: ["React"] }],
  languages: [{ name: "English", level: "Native" }],
  contacts: [{ type: "EMAIL", value: "ada@example.com" }],
  certifications: [{ title: "AWS", issuer: "Amazon", year: 2024 }],
};

function createDb() {
  return {
    appLanguage: {
      findMany: jest.fn().mockResolvedValue([{ id: "lang-en", code: "en" }]),
    },
    cvHeader: {
      upsert: jest.fn().mockResolvedValue({ id: "hdr-1" }),
    },
    cvHeaderTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    cvAboutMe: {
      upsert: jest.fn().mockResolvedValue({ id: "about-1" }),
    },
    cvAboutMeTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    cvContact: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    },
    cvEducation: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    },
    cvLanguage: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    },
    cvTechnicalSkill: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    },
    cvExperience: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    },
    certification: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
  };
}

describe("persistCvImportDraft", () => {
  it("writes header, about, contacts, education, skills, and experience", async () => {
    const db = createDb();
    await persistCvImportDraft(db as never, "user-1", draft);

    expect(db.cvHeader.upsert).toHaveBeenCalled();
    expect(db.cvHeaderTranslation.create).toHaveBeenCalled();
    expect(db.cvAboutMe.upsert).toHaveBeenCalled();
    expect(db.cvContact.create).toHaveBeenCalled();
    expect(db.cvEducation.create).toHaveBeenCalled();
    expect(db.cvLanguage.create).toHaveBeenCalled();
    expect(db.cvTechnicalSkill.create).toHaveBeenCalled();
    expect(db.cvExperience.create).toHaveBeenCalled();
    expect(db.certification.create).toHaveBeenCalledWith(
      expect.objectContaining<Record<string, unknown>>({
        data: expect.objectContaining({ company: "Amazon" }),
      }),
    );
  });

  it("skips duplicate certifications and updates existing translations", async () => {
    const db = createDb();
    db.cvHeaderTranslation.findFirst.mockResolvedValue({ id: "ht-1" });
    db.cvAboutMeTranslation.findFirst.mockResolvedValue({ id: "at-1" });
    db.certification.findMany.mockResolvedValue([
      {
        company: "Amazon",
        CertificationTranslation: [{ title: "AWS" }],
      },
    ]);

    await persistCvImportDraft(db as never, "user-1", draft);

    expect(db.cvHeaderTranslation.update).toHaveBeenCalled();
    expect(db.cvAboutMeTranslation.update).toHaveBeenCalled();
    expect(db.certification.create).not.toHaveBeenCalled();
  });
});
