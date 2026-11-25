/** @jest-environment node */

jest.mock("@/features/resume-engine/lib/ai/tailor-resume-prompt", () => {
  const actual = jest.requireActual<
    typeof import("@/features/resume-engine/lib/ai/tailor-resume-prompt")
  >("@/features/resume-engine/lib/ai/tailor-resume-prompt");
  return {
    buildTailoredResumePrompt: jest.fn(),
    buildTailorCorrectionPrompt: actual.buildTailorCorrectionPrompt,
  };
});
jest.mock("@/features/resume-engine/lib/ai/tailor-resume", () => ({
  tailorResumeDocument: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/ai/extract-structured", () => ({
  extractStructuredResume: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/import-persist", () => ({
  persistCvImportDraft: jest.fn(),
}));
jest.mock("@/features/cv/lib/load-cv-structured-draft", () => ({
  loadCvStructuredDraft: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/finalize-tailor-export", () => ({
  finalizeTailoredResume: jest.fn(),
}));
jest.mock("@/lib/uploadthing/tenant-uploadthing", () => ({
  UploadThingNotConfiguredError: class UploadThingNotConfiguredError extends Error {},
}));
jest.mock("@/features/resume-engine/lib/fetch-upload-docx", () => ({
  fetchUploadDocxSections: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/ai/prompt-package", () => ({
  buildImportPromptPackage: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/ai/tailor-job-context", () => ({
  loadTailorJobContext: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/ai/providers", () => ({
  getAvailableAiProviders: jest.fn(),
  getDefaultAiProvider: jest.fn(),
  loadTenantAiCredentials: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/parse-pdf-for-import", () => ({
  isPdfUpload: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/docx/generate-from-structured", () => ({
  generateDocxFromStructured: jest.fn(),
}));
jest.mock("@/lib/ilovepdf/tenant-ilovepdf", () => ({
  convertDocxToPdfForTenant: jest
    .fn()
    .mockResolvedValue(Buffer.from("%PDF-mock")),
  isTenantILovePdfConfigured: jest.fn().mockResolvedValue(true),
  ILovePdfNotConfiguredError: class ILovePdfNotConfiguredError extends Error {},
}));
jest.mock("@/lib/uploadthing/upload-buffer", () => ({
  uploadBufferToUploadThing: jest.fn(),
}));

import { persistCvImportDraft } from "@/features/resume-engine/lib/import-persist";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { finalizeTailoredResume } from "@/features/resume-engine/lib/finalize-tailor-export";
import {
  resumeFixture,
  resumeResponseFixture,
} from "@/features/resume-engine/lib/tailored-resume.fixture";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import { fetchUploadDocxSections } from "@/features/resume-engine/lib/fetch-upload-docx";
import { buildImportPromptPackage } from "@/features/resume-engine/lib/ai/prompt-package";
import {
  getAvailableAiProviders,
  getDefaultAiProvider,
  loadTenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import { resumeEngineAdminRouter } from "./resume-engine-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const draft = {
  detectedLocale: "en" as const,
  header: { fullName: "Ada Lovelace" },
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  contacts: [],
  certifications: [],
};

const upload = {
  id: "up-1",
  userId: MOCK_OWNER_USER.id,
  fileName: "cv.docx",
  importStatus: "preview",
  parsedDraft: draft,
};

function createDb() {
  return {
    cvSourceUpload: {
      create: jest.fn().mockResolvedValue(upload),
      findUnique: jest.fn().mockResolvedValue(upload),
      findMany: jest.fn().mockResolvedValue([upload]),
      update: jest.fn().mockResolvedValue(upload),
    },
    profile: {
      findUnique: jest.fn().mockResolvedValue({ defaultLocale: "en" }),
    },
    application: { findFirst: jest.fn().mockResolvedValue(null) },
    resumeExport: { findFirst: jest.fn().mockResolvedValue(null) },
    cvTechnologyEquivalence: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

describe("resumeEngineAdminRouter", () => {
  beforeEach(() => {
    jest.mocked(loadTenantAiCredentials).mockResolvedValue({
      keys: { gemini: "key" },
    } as never);
    jest
      .mocked(getAvailableAiProviders)
      .mockReturnValue([
        { id: "gemini", label: "Gemini", model: "gemini-2.5-pro" },
      ] as never);
    jest.mocked(getDefaultAiProvider).mockReturnValue("gemini");
    jest.mocked(fetchUploadDocxSections).mockResolvedValue({
      upload,
      sections: [{ heading: "Experience", lines: ["Acme"] }],
    } as never);
    jest.mocked(buildImportPromptPackage).mockReturnValue({
      prompt: "import this",
    } as never);
    jest.mocked(loadCvStructuredDraft).mockResolvedValue(draft);
    jest.mocked(persistCvImportDraft).mockResolvedValue(undefined);
  });

  it("returns tenant AI settings", async () => {
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    await expect(caller.getAiSettings()).resolves.toMatchObject({
      defaultProvider: "gemini",
      hasAutoProviders: true,
    });
  });

  it("registers an upload and returns an import prompt", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db }),
    );
    await caller.registerUpload({
      originalFileUrl: "https://cdn.example/cv.docx",
      uploadThingKey: "key-1",
      fileName: "cv.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(db.cvSourceUpload.create).toHaveBeenCalled();

    const prompt = await caller.getImportPrompt({ uploadId: "up-1" });
    expect(prompt).toMatchObject({ prompt: "import this" });
  });

  it("accepts a manual import draft and rejects invalid JSON", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db }),
    );
    const saved = await caller.submitManualImportDraft({
      uploadId: "up-1",
      rawJson: JSON.stringify(draft),
    });
    expect(saved.draft.header.fullName).toBe("Ada Lovelace");

    await expect(
      caller.submitManualImportDraft({
        uploadId: "up-1",
        rawJson: "{not-json",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("loads, updates, and confirms an import draft", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db }),
    );
    const preview = await caller.getUploadPreview({ uploadId: "up-1" });
    expect(preview.draft?.header.fullName).toBe("Ada Lovelace");

    await caller.updateDraft({ uploadId: "up-1", draft });
    await caller.confirmImport({ uploadId: "up-1" });
    expect(persistCvImportDraft).toHaveBeenCalled();
    expect(db.cvSourceUpload.update).toHaveBeenCalled();
  });

  it("rejects confirmImport when there is no parsed draft", async () => {
    const db = createDb();
    db.cvSourceUpload.findUnique.mockResolvedValue({
      ...upload,
      parsedDraft: null,
    });
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db }),
    );
    await expect(
      caller.confirmImport({ uploadId: "up-1" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns tailor page data with only CMS content", async () => {
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    const page = await caller.getTailorPageData({});
    expect(page.hasStudioData).toBe(true);
    expect(page.studioPreview).toEqual({
      fullName: "Ada Lovelace",
      experienceCount: 0,
    });
    expect(page).not.toHaveProperty("uploads");
    expect(page.application).toBeNull();
  });
  it("rejects external sources and the old manual JSON contract", async () => {
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    const input = {
      templateVersion: "v2" as const,
      jobDescription: "A role developing React applications.",
    };
    await expect(
      caller.getTailorPrompt({
        ...input,
        sourceType: "upload",
        uploadId: "up-1",
      } as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.tailorResumeManual({
        ...input,
        rawJson: JSON.stringify({ detectedLocale: "en", edits: [] }),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("validates the manual document before persisting it", async () => {
    jest
      .mocked(loadCvStructuredDraft)
      .mockImplementation((_db, _user, options) =>
        Promise.resolve(resumeFixture(options?.locale ?? "en")),
      );
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    const response = resumeResponseFixture(resumeFixture("en"), "v2");
    await caller.tailorResumeManual({
      templateVersion: "v2",
      targetLocale: "en",
      jobDescription: "Buscamos desarrollador de aplicaciones React.",
      rawJson: JSON.stringify(response),
    });
    const persisted = jest.mocked(finalizeTailoredResume).mock.calls.at(-1)!;
    expect(persisted[1]).toBe(MOCK_OWNER_USER.id);
    expect(persisted[2].aiProvider).toBe("manual");
    expect(persisted[2].document).toMatchObject({
      schemaVersion: 1,
      locale: "en",
      templateId: "v2",
    });
    const fieldId = "experience.exp-0.bullet.resp-0-2";
    const field = response.fields.find(({ id }) => id === fieldId)!;
    field.text = field.text.replace("25%", "50%");
    const invalidResponse = await fetchRequestHandler({
      endpoint: "/api/trpc",
      router: resumeEngineAdminRouter,
      createContext: () => createTrpcTestContext({ db: createDb() }),
      req: new Request("http://localhost/api/trpc/tailorResumeManual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          superjson.serialize({
            templateVersion: "v2",
            targetLocale: "en",
            jobDescription: "Buscamos desarrollador de aplicaciones React.",
            rawJson: JSON.stringify(response),
          }),
        ),
      }),
    });

    expect(invalidResponse.status).toBe(400);
    expect(await invalidResponse.json()).toMatchObject({
      error: {
        json: {
          data: {
            code: "BAD_REQUEST",
            resumeTailorIssues: [
              {
                fieldId,
                bullet: 2,
                context: "Acme · Software Engineer",
                reason: "numericFacts",
                numericFacts: { original: ["25%"], proposed: ["50%"] },
              },
            ],
          },
        },
      },
    });
  });
  it("exports only confirmed vacancy terms, across case variants, without attributing them to jobs", async () => {
    const source = resumeFixture("es");
    source.skills[1].items.push("REST APIs");
    source.skills[1].skillIds!.push("skill-rest");
    const original = structuredClone(source);
    jest.mocked(loadCvStructuredDraft).mockResolvedValue(source);
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    const raw = resumeResponseFixture(source, "v1");
    const input = {
      templateVersion: "v1" as const,
      jobDescription: "Stack: ASP.NET Core, MVC, APIs REST, quiet oak y React.",
      confirmedTechnologies: [
        "asp.net core",
        "ASP.NET Core",
        "quiet oak",
        "React",
        "APIs REST",
      ],
      rawJson: JSON.stringify({
        ...raw,
        technologyNames: [{ skillId: "skill-rest", name: "APIs REST" }],
      }),
    };
    await caller.tailorResumeManual(input);
    const doc = jest.mocked(finalizeTailoredResume).mock.lastCall![2].document;
    expect(doc.skills.at(-1)?.items).toEqual(
      expect.arrayContaining(["ASP.NET Core", "Quiet Oak"]),
    );
    expect(doc.skills.at(-1)?.items).toHaveLength(2);
    expect(
      doc.skills
        .flatMap(({ items }) => items)
        .filter((name) => name === "APIs REST"),
    ).toHaveLength(1);
    expect(doc.skills.flatMap((group) => group.items)).not.toContain("MVC");
    expect(source).toEqual(original);
    await expect(
      caller.tailorResumeManual({
        ...input,
        confirmedTechnologies: ["not in the vacancy"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const bullet = raw.fields.find((field) => field.id.includes(".bullet."))!;
    bullet.text += " ASP.NET Core";
    await expect(
      caller.tailorResumeManual({ ...input, rawJson: JSON.stringify(raw) }),
    ).rejects.toThrow("unsupported technologies");
  });

  it("applies user-approved technology equivalences and builds manual correction prompts on rejection", async () => {
    const source = resumeFixture("en");
    source.skills[1].items.push("REST APIs");
    source.skills[1].skillIds!.push("skill-rest");
    jest.mocked(loadCvStructuredDraft).mockResolvedValue(source);
    const db = createDb();
    const caller = createRouterCaller(
      resumeEngineAdminRouter,
      createTrpcTestContext({ db }),
    );
    const raw = resumeResponseFixture(source, "v2");
    const rawJson = JSON.stringify({
      ...raw,
      technologyNames: [{ skillId: "skill-rest", name: "RESTful APIs" }],
    });
    const baseInput = {
      templateVersion: "v2" as const,
      jobDescription:
        "We build scalable RESTful APIs in cloud-native services.",
      rawJson,
    };

    await expect(caller.tailorResumeManual(baseInput)).rejects.toThrow(
      "different technology",
    );

    const correction = await caller.getTailorCorrectionPrompt({
      templateVersion: baseInput.templateVersion,
      jobDescription: baseInput.jobDescription,
      rejectedTechnologyEquivalences: [
        { original: "REST APIs", proposed: "RESTful APIs" },
      ],
      previousRawJson: rawJson,
      validationError:
        "Technology name “REST APIs” → “RESTful APIs”: display name belongs to a different technology.",
    });
    expect(correction.userPrompt).toContain(
      '"REST APIs" and "RESTful APIs" are DIFFERENT technologies',
    );
    expect(correction.combinedPrompt).toContain(rawJson);

    await expect(
      caller.tailorResumeManual({
        ...baseInput,
        technologyEquivalences: [
          { original: "REST APIs", proposed: "not in vacancy" },
        ],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await caller.tailorResumeManual({
      ...baseInput,
      technologyEquivalences: [
        { original: "REST APIs", proposed: "RESTful APIs" },
      ],
    });
    expect(db.cvTechnologyEquivalence.upsert).toHaveBeenCalledTimes(1);
    expect(db.cvTechnologyEquivalence.upsert.mock.calls[0]?.[0]).toMatchObject({
      create: {
        userId: MOCK_OWNER_USER.id,
        original: "REST APIs",
        originalKey: "rest apis",
        proposed: "RESTful APIs",
        proposedKey: "restful apis",
      },
    });
    const doc = jest.mocked(finalizeTailoredResume).mock.lastCall![2].document;
    expect(doc.skills[1].items).toContain("RESTful APIs");

    db.cvTechnologyEquivalence.findMany.mockResolvedValue([
      { id: "eq-1", original: "REST APIs", proposed: "RESTful APIs" },
    ]);
    await expect(caller.getTailorPageData({})).resolves.toMatchObject({
      savedTechnologyEquivalences: [
        { id: "eq-1", original: "REST APIs", proposed: "RESTful APIs" },
      ],
    });
    await caller.tailorResumeManual(baseInput);
    const nextDoc = jest.mocked(finalizeTailoredResume).mock.lastCall![2]
      .document;
    expect(nextDoc.skills[1].items).toContain("RESTful APIs");

    await caller.deleteTechnologyEquivalence({ id: "eq-1" });
    expect(db.cvTechnologyEquivalence.deleteMany).toHaveBeenCalledWith({
      where: { id: "eq-1", userId: MOCK_OWNER_USER.id },
    });
  });
});
