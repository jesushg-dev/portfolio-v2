jest.mock("@/features/resume-engine/lib/ai/providers", () => ({
  getAvailableAiProviders: jest.fn(),
  getDefaultAiProvider: jest.fn(),
  loadTenantAiCredentials: jest.fn(),
}));
jest.mock("@/features/resume-engine/lib/ai/generate-interview-prep", () => ({
  generateInterviewPrepPack: jest.fn(),
}));
jest.mock(
  "@/features/resume-engine/lib/ai/interview-prep-prompt-package",
  () => ({
    buildInterviewPrepPromptPackage: jest.fn(),
  }),
);
jest.mock(
  "@/features/resume-engine/lib/resolve-interview-prep-context",
  () => ({
    resolveInterviewPrepContext: jest.fn(),
  }),
);
jest.mock("@/features/resume-engine/lib/persist-interview-prep", () => ({
  persistInterviewPrepQuestions: jest.fn(),
}));

import {
  getAvailableAiProviders,
  getDefaultAiProvider,
  loadTenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import { interviewPrepAdminRouter } from "./interview-prep-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
} from "@/test-utils/trpc-caller";

describe("interviewPrepAdminRouter", () => {
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
  });

  it("returns AI settings", async () => {
    const caller = createRouterCaller(
      interviewPrepAdminRouter,
      createTrpcTestContext({ db: {} }),
    );
    await expect(caller.getAiSettings()).resolves.toMatchObject({
      defaultProvider: "gemini",
      hasAutoProviders: true,
    });
  });

  it("throws when the application is missing", async () => {
    const caller = createRouterCaller(
      interviewPrepAdminRouter,
      createTrpcTestContext({
        db: { application: { findFirst: jest.fn().mockResolvedValue(null) } },
      }),
    );
    await expect(
      caller.getInterviewPrepPageData({
        applicationId: "app-1",
        eventId: "ev-1",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns stored questions for an event", async () => {
    const db = {
      application: {
        findFirst: jest.fn().mockResolvedValue({
          id: "app-1",
          position: "Engineer",
          description: "Need a React engineer with tests.",
          company: { name: "Acme" },
        }),
      },
      applicationEvent: {
        findFirst: jest.fn().mockResolvedValue({
          id: "ev-1",
          type: "INTERVIEW",
          title: "Intro",
          scheduledDate: new Date("2026-01-01"),
          completed: false,
        }),
      },
      resumeExport: { findFirst: jest.fn().mockResolvedValue(null) },
      interviewPrepQuestion: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "q-1",
            eventId: "ev-1",
            category: "role",
            question: "Why this role?",
            whyTheyAsk: "Fit",
            modelAnswer: "Because",
            talkingPoints: ["A"],
            evidenceFromCv: ["B"],
            avoid: ["C"],
            createdAt: new Date("2026-01-01"),
          },
        ]),
      },
    };
    const caller = createRouterCaller(
      interviewPrepAdminRouter,
      createTrpcTestContext({ db }),
    );
    const page = await caller.getInterviewPrepPageData({
      applicationId: "app-1",
      eventId: "ev-1",
    });
    expect(page.companyName).toBe("Acme");
    expect(page.hasJobDescription).toBe(true);
    expect(page.questions[0]?.question).toBe("Why this role?");
  });
});
