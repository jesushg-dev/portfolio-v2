jest.mock("@/lib/geo/geocode-place", () => ({
  geocodePlace: jest.fn().mockResolvedValue({ lat: 19.43, lon: -99.13 }),
}));

import { TRPCError } from "@trpc/server";

import { cvRouter } from "./cv.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  mockOwnerTenant,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];
const enText = { "lang-en": { text: "Hello" } };

function translationTable() {
  return {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
  };
}

function ownedCrud(id: string, extra: Record<string, unknown> = {}) {
  const row = { id, userId: MOCK_OWNER_USER.id, ...extra };
  return {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(row),
    findUniqueOrThrow: jest.fn().mockResolvedValue(row),
    create: jest.fn().mockResolvedValue(row),
    update: jest.fn().mockResolvedValue(row),
    delete: jest.fn().mockResolvedValue(row),
    upsert: jest.fn().mockResolvedValue(row),
  };
}

function emptyCvDb() {
  return {
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
    profile: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({
        username: "ada",
        userId: MOCK_OWNER_USER.id,
      }),
    },
    cvHeader: {
      ...ownedCrud("hdr-1", { fullName: "Ada" }),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    cvHeaderTranslation: translationTable(),
    cvAboutMe: ownedCrud("about-1"),
    cvAboutMeTranslation: translationTable(),
    cvContact: ownedCrud("c1", { type: "EMAIL", value: "a@b.com" }),
    cvEducation: ownedCrud("edu-1", { institution: "UNI" }),
    cvEducationTranslation: translationTable(),
    cvLanguage: ownedCrud("lang-1"),
    cvLanguageTranslation: translationTable(),
    cvTechnicalSkill: ownedCrud("skill-1", {
      category: "FRONTEND",
      items: ["React"],
    }),
    cvExperience: ownedCrud("exp-1", { company: "Acme" }),
    cvExperienceTranslation: translationTable(),
    cvExperienceSkill: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    cvResponsibility: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    cvSoftSkill: ownedCrud("soft-1"),
    cvSoftSkillTranslation: translationTable(),
    cvAdditionalInfo: ownedCrud("add-1"),
    cvAdditionalInfoTranslation: translationTable(),
    cvPersonalReference: ownedCrud("ref-1", { name: "Grace" }),
    cvPersonalReferenceTranslation: translationTable(),
    cvPdfLink: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { locale: "en", url: "https://cdn.example/cv.pdf" },
        ]),
      findUnique: jest.fn().mockResolvedValue({ id: "pdf-1" }),
      upsert: jest.fn().mockResolvedValue({ locale: "en" }),
      delete: jest.fn().mockResolvedValue({ id: "pdf-1" }),
    },
    $transaction: jest.fn(async (ops: unknown) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return undefined;
    }),
  };
}

describe("cvRouter", () => {
  it("hides getPublic when the tenant CV is unpublished", async () => {
    const caller = createRouterCaller(
      cvRouter,
      createTrpcTestContext({
        db: emptyCvDb(),
        tenant: { ...mockOwnerTenant, isPrimary: false, isPublished: false },
      }),
    );
    await expect(caller.getPublic()).resolves.toBeNull();
  });

  it("returns the full CV for a visible tenant", async () => {
    const caller = createRouterCaller(
      cvRouter,
      createTrpcTestContext({ db: emptyCvDb() }),
    );
    const result = await caller.getPublic();
    expect(result).toMatchObject({
      contacts: [],
      educations: [],
      experiences: [],
    });
  });

  it("returns getMine for the authenticated owner", async () => {
    const caller = createRouterCaller(
      cvRouter,
      createTrpcTestContext({ db: emptyCvDb() }),
    );
    const result = await caller.getMine();
    expect(result.header).toBeNull();
  });

  it("upserts a header and creates translations", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    const header = await caller.upsertHeader({
      fullName: "Ada Lovelace",
      degree: { "lang-en": { text: "Math" } },
      heroSummary: { "lang-en": { text: "Builder" } },
    });
    expect(header.fullName).toBe("Ada");
    expect(db.cvHeaderTranslation.create).toHaveBeenCalled();
  });

  it("upserts about-me translations", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.upsertAboutMe({ aboutMe: enText });
    expect(db.cvAboutMeTranslation.create).toHaveBeenCalled();
  });

  it("creates and deletes a contact", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.createContact({
      type: "EMAIL",
      value: "a@b.com",
      label: { "lang-en": { text: "Work" } },
      order: 0,
    });
    await expect(caller.deleteContact({ id: "c1" })).resolves.toEqual(
      expect.objectContaining({ id: "c1" }),
    );
  });

  it("creates, updates, and deletes education", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.createEducation({
      institution: "UNI",
      degreeName: enText,
      location: enText,
      description: enText,
      startYear: 2015,
      endYear: 2019,
      order: 0,
    });
    await caller.updateEducation({
      id: "edu-1",
      institution: "UNI",
      degreeName: enText,
      order: 1,
    });
    await expect(caller.deleteEducation({ id: "edu-1" })).resolves.toEqual(
      expect.objectContaining({ id: "edu-1" }),
    );
  });

  it("creates, updates, and deletes spoken languages", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.createLanguage({ name: enText, level: enText, order: 0 });
    await caller.updateLanguage({
      id: "lang-1",
      name: enText,
      level: enText,
      order: 1,
    });
    await expect(caller.deleteLanguage({ id: "lang-1" })).resolves.toEqual(
      expect.objectContaining({ id: "lang-1" }),
    );
  });

  it("creates, updates, and deletes technical skills", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.createTechnicalSkill({
      category: "FRONTEND",
      items: ["React"],
      order: 0,
    });
    await caller.updateTechnicalSkill({
      id: "skill-1",
      category: "FRONTEND",
      items: ["React", "Next.js"],
      order: 1,
    });
    await expect(
      caller.deleteTechnicalSkill({ id: "skill-1" }),
    ).resolves.toEqual(expect.objectContaining({ id: "skill-1" }));
  });

  it("creates an experience with skills and responsibilities", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.createExperience({
      company: "Acme",
      role: enText,
      location: enText,
      companyBlurb: enText,
      current: true,
      featuredOnHome: true,
      skillIds: ["sk-1"],
      order: 0,
      responsibilities: [{ text: enText, order: 0, atsOnly: false }],
    });
    expect(db.cvExperience.create).toHaveBeenCalled();
  });

  it("updates an experience and syncs skills", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.updateExperience({
      id: "exp-1",
      company: "Acme",
      role: enText,
      skillIds: ["sk-2"],
      order: 0,
      responsibilities: [{ text: enText, order: 0, atsOnly: true }],
    });
    await caller.syncExperienceSkills({
      experienceId: "exp-1",
      skillIds: ["sk-3"],
    });
    expect(db.cvExperienceSkill.createMany).toHaveBeenCalled();
    await expect(caller.deleteExperience({ id: "exp-1" })).resolves.toEqual(
      expect.objectContaining({ id: "exp-1" }),
    );
  });

  it("rejects mutations for records owned by another user", async () => {
    const db = emptyCvDb();
    db.cvEducation.findUnique.mockResolvedValue({
      id: "edu-1",
      userId: "other",
    });
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await expect(
      caller.deleteEducation({ id: "edu-1" }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("creates, updates, and deletes CV soft skills and extras", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.createSoftSkill({ name: enText, order: 0 });
    await caller.updateSoftSkill({ id: "soft-1", name: enText, order: 1 });
    await caller.deleteSoftSkill({ id: "soft-1" });

    await caller.createAdditionalInfo({ text: enText, order: 0 });
    await caller.updateAdditionalInfo({ id: "add-1", text: enText, order: 1 });
    await caller.deleteAdditionalInfo({ id: "add-1" });

    await caller.createPersonalReference({
      name: "Grace",
      contact: "grace@example.com",
      role: enText,
      order: 0,
    });
    await caller.updatePersonalReference({
      id: "ref-1",
      name: "Grace",
      contact: "  ",
      role: enText,
      order: 1,
    });
    await caller.deletePersonalReference({ id: "ref-1" });
    expect(db.cvPersonalReference.delete).toHaveBeenCalled();
  });

  it("upserts profile settings and geocodes a map label", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.upsertProfile({
      username: "ada-lovelace",
      displayName: "Ada",
      logoInitials: "AL",
      logoImageUrl: "https://cdn.example/logo.png",
      defaultLocale: "en",
      isPublished: true,
      mapLocationLabel: "Mexico City",
    });
    expect(db.profile.upsert).toHaveBeenCalled();
  });

  it("rejects a username taken by another user", async () => {
    const db = emptyCvDb();
    db.profile.findUnique.mockResolvedValue({
      username: "taken",
      userId: "other",
    });
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await expect(
      caller.upsertProfile({
        username: "taken",
        defaultLocale: "en",
        isPublished: false,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("lists, upserts, and deletes PDF links", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await expect(caller.getPdfLinks()).resolves.toHaveLength(1);
    await caller.upsertPdfLink({
      locale: "en",
      url: "https://cdn.example/cv.pdf",
      label: "CV",
    });
    await caller.deletePdfLink({ locale: "en" });
    expect(db.cvPdfLink.delete).toHaveBeenCalled();
  });

  it("reorders contacts in a transaction", async () => {
    const db = emptyCvDb();
    const caller = createRouterCaller(cvRouter, createTrpcTestContext({ db }));
    await caller.reorderContacts([
      { id: "c1", order: 1 },
      { id: "c2", order: 0 },
    ]);
    await caller.reorderExperiences([{ id: "exp-1", order: 0 }]);
    await caller.reorderEducations([{ id: "edu-1", order: 0 }]);
    await caller.reorderLanguages([{ id: "lang-1", order: 0 }]);
    await caller.reorderTechnicalSkills([{ id: "skill-1", order: 0 }]);
    await caller.reorderSoftSkills([{ id: "soft-1", order: 0 }]);
    await caller.reorderAdditionalInfo([{ id: "add-1", order: 0 }]);
    await caller.reorderPersonalReferences([{ id: "ref-1", order: 0 }]);
    expect(db.$transaction).toHaveBeenCalled();
  });
});
