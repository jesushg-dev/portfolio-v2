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
    expect(page.suggestedTools).toContain("React");
  });

  it("passes focusTools to getInterviewPrepPrompt", async () => {
    const { resolveInterviewPrepContext } =
      await import("@/features/resume-engine/lib/resolve-interview-prep-context");
    const { buildInterviewPrepPromptPackage } =
      await import("@/features/resume-engine/lib/ai/interview-prep-prompt-package");

    jest.mocked(resolveInterviewPrepContext).mockResolvedValue({
      applicationId: "app-1",
      position: "Dev",
      companyName: "Acme",
      jobDescription: "React role",
      draft: {} as never,
      matchAnalysis: null,
      source: "export",
      event: { id: "ev-1", type: "INTERVIEW", title: "Tech", notes: null },
    });

    jest.mocked(buildInterviewPrepPromptPackage).mockReturnValue({
      systemPrompt: "system",
      userPrompt: "user",
      combinedPrompt: "system\n\nuser",
    });

    const caller = createRouterCaller(
      interviewPrepAdminRouter,
      createTrpcTestContext({ db: {} }),
    );

    const prompt = await caller.getInterviewPrepPrompt({
      applicationId: "app-1",
      eventId: "ev-1",
      focusTools: ["React", "PostgreSQL"],
    });

    expect(prompt.systemPrompt).toBe("system");
    expect(prompt.userPrompt).toBe("user");
    expect(buildInterviewPrepPromptPackage).toHaveBeenCalledWith(
      expect.anything(),
      "React role",
      null,
      expect.objectContaining({
        focusTools: ["React", "PostgreSQL"],
      }),
    );
  });

  it("passes focusTools to generateInterviewPrep auto generator", async () => {
    const { resolveInterviewPrepContext } =
      await import("@/features/resume-engine/lib/resolve-interview-prep-context");
    const { generateInterviewPrepPack } =
      await import("@/features/resume-engine/lib/ai/generate-interview-prep");
    const { persistInterviewPrepQuestions } =
      await import("@/features/resume-engine/lib/persist-interview-prep");

    jest.mocked(resolveInterviewPrepContext).mockResolvedValue({
      applicationId: "app-1",
      position: "Dev",
      companyName: "Acme",
      jobDescription: "React role",
      draft: {} as never,
      matchAnalysis: null,
      source: "export",
      event: { id: "ev-1", type: "INTERVIEW", title: "Tech", notes: null },
    });

    jest.mocked(generateInterviewPrepPack).mockResolvedValue({
      provider: "gemini",
      result: {
        detectedLocale: "en",
        questions: [
          {
            category: "technical",
            question: "How do you optimize React render cycles?",
            whyTheyAsk: "Testing depth",
            modelAnswer: "Use memo and profiling.",
            talkingPoints: ["memo", "profiler"],
            evidenceFromCv: [],
            avoid: [],
          },
        ],
      },
    });

    jest.mocked(persistInterviewPrepQuestions).mockResolvedValue([
      {
        id: "q-tool",
        eventId: "ev-1",
        category: "technical",
        question: "How do you optimize React render cycles?",
        whyTheyAsk: "Testing depth",
        modelAnswer: "Use memo and profiling.",
        talkingPoints: ["memo", "profiler"],
        evidenceFromCv: [],
        avoid: [],
        createdAt: new Date("2026-01-01"),
      },
    ]);

    const caller = createRouterCaller(
      interviewPrepAdminRouter,
      createTrpcTestContext({ db: {} }),
    );

    const result = await caller.generateInterviewPrep({
      applicationId: "app-1",
      eventId: "ev-1",
      replace: true,
      focusTools: ["React"],
    });

    expect(generateInterviewPrepPack).toHaveBeenCalledWith(
      expect.anything(),
      "React role",
      null,
      expect.objectContaining({
        focusTools: ["React"],
      }),
      expect.anything(),
      undefined,
    );
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]?.question).toContain("React");
  });
});
