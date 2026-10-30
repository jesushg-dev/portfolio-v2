jest.mock("@/features/resume-engine/lib/ai/tailor-resume-prompt", () => ({
  buildTailoredResumePrompt: jest.fn(),
}));
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
    await expect(
      caller.tailorResumeManual({
        templateVersion: "v2",
        targetLocale: "en",
        jobDescription: "Buscamos desarrollador de aplicaciones React.",
        rawJson: JSON.stringify({ ...response, fields: [] }),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
