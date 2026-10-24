import { decode } from "@toon-format/toon";
import { buildTailoredResumePrompt } from "./tailor-resume-prompt";
import { resumeSelectionFixture } from "../tailored-resume.fixture";
jest.mock("openai", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@google/genai", () => ({ GoogleGenAI: jest.fn() }));
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("./providers", () => ({
  AI_PROVIDER_MODELS: { openai: "test-model" },
  resolveAiProvider: () => "openai",
  requireTenantAiApiKey: () => "test-key",
}));
import OpenAI from "openai";
import { tailorResumeDocument } from "./tailor-resume";
import { resumeFixture } from "../tailored-resume.fixture";
import {
  resumeTextFields,
  validateTailoredResume,
  type TailorContext,
} from "../tailored-resume-document";

const context: TailorContext = {
  drafts: {
    en: resumeFixture("en"),
    es: resumeFixture("es"),
    nl: resumeFixture("nl"),
  },
  templateId: "v2",
  targetLocale: "en",
  uiLocale: "es",
  jobDescription: "Buscamos desarrollador con experiencia en React y SQL.",
};
const response = {
  schemaVersion: 1,
  locale: "en",
  aiScore: 90,
  selection: resumeSelectionFixture(context.drafts.en),
  fields: resumeTextFields(context.drafts.en, "v2").map(({ id, text }) => ({
    id,
    text,
  })),
};
const completion = (value: unknown) => ({
  choices: [
    {
      message: {
        content: typeof value === "string" ? value : JSON.stringify(value),
      },
    },
  ],
});
describe("automatic and manual resume contract", () => {
  it("rejects inconsistent shared facts instead of silently using another locale's data", () => {
    const conflicting: TailorContext = {
      ...context,
      drafts: {
        ...context.drafts,
        es: {
          ...context.drafts.es,
          experiences: context.drafts.es.experiences.map((experience, index) =>
            index === 0
              ? { ...experience, company: "Different employer" }
              : experience,
          ),
        },
      },
    };
    expect(() => buildTailoredResumePrompt(conflicting)).toThrow(
      "CMS facts differ across locales (es)",
    );
  });
  it("keeps the explicit CV locale distinct from the interface and job locale", () => {
    const prompt = buildTailoredResumePrompt(context);
    const input = decode(prompt.userPrompt) as {
      targetLocale: string;
      uiLocale: string;
      promptVersion: string;
      responseContract: { immutableIdentityRule: string };
      facts: { experiences: unknown[] };
      sources: { en: { fields: { id: string; text: string }[] } };
    };
    expect(() => {
      JSON.parse(prompt.userPrompt);
    }).toThrow();
    expect(prompt.systemPrompt).toContain("Input serialization: TOON");
    expect(input).toMatchObject({
      targetLocale: "en",
      uiLocale: "es",
    });
    expect(prompt.systemPrompt).toContain("Every field ID");
    expect(prompt.systemPrompt).toContain("exclusive allowlist");
    expect(input.responseContract.immutableIdentityRule).toContain(
      "Do not include it in fields",
    );
    expect(prompt.userPrompt).toContain("experience.exp-0.bullet.resp-0-1");
    const sources = input.sources;
    expect(input.facts.experiences[0]).not.toHaveProperty("responsibilities");
    expect(sources.en).not.toHaveProperty("facts");
    expect(input.promptVersion).toBe("tailored-cv/2026-10-23.2");
    expect(sources.en.fields).toContainEqual(
      expect.objectContaining({
        id: "experience.exp-0.bullet.resp-0-1",
        text: context.drafts.en.experiences[0].responsibilities[0],
      }),
    );
    expect(
      sources.en.fields.some(
        (field: { id: string }) => field.id === "header.fullName",
      ),
    ).toBe(false);
    expect(prompt.systemPrompt).toContain(
      "Never equate general professional English proficiency with CEFR C1",
    );
  });
  it("produces exactly the document accepted by manual validation", async () => {
    const create = jest.fn().mockResolvedValue(completion(response));
    jest
      .mocked(OpenAI)
      .mockImplementation(
        () => ({ chat: { completions: { create } } }) as never,
      );
    const automatic = await tailorResumeDocument(context, {
      keys: {},
      defaultProvider: null,
    });
    expect(automatic.document).toEqual(
      validateTailoredResume(response, context).document,
    );
  });
  it.each([completion({ ...response, locale: "es" }), completion("not json")])(
    "repairs invalid content once",
    async (first) => {
      const create = jest
        .fn()
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(completion(response));
      jest
        .mocked(OpenAI)
        .mockImplementation(
          () => ({ chat: { completions: { create } } }) as never,
        );
      expect(
        (
          await tailorResumeDocument(context, {
            keys: {},
            defaultProvider: null,
          })
        ).document.locale,
      ).toBe("en");
      expect(create).toHaveBeenCalledTimes(2);
      const request = (
        create.mock.calls as [{ messages: { content: string }[] }][]
      )[1][0];
      expect(request.messages[1].content).toContain("Validation errors");
    },
  );
  it("reports unresolved translations without restoring original content", async () => {
    const create = jest
      .fn()
      .mockResolvedValue(completion({ ...response, fields: [] }));
    jest
      .mocked(OpenAI)
      .mockImplementation(
        () => ({ chat: { completions: { create } } }) as never,
      );
    await expect(
      tailorResumeDocument(context, { keys: {}, defaultProvider: null }),
    ).rejects.toThrow("header.summary: missing translation");
    expect(create).toHaveBeenCalledTimes(2);
  });
});
