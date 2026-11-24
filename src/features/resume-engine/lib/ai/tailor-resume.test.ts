import { decode } from "@toon-format/toon";
import {
  buildTailoredResumePrompt,
  TAILORED_RESUME_PROMPT_VERSION,
} from "./tailor-resume-prompt";
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
import {
  discoverVacancyTechnologies,
  tailorResumeDocument,
} from "./tailor-resume";
import { resumeFixture } from "../tailored-resume.fixture";
import {
  resumeTextFields,
  validateTailoredResume,
  type TailorContext,
} from "../tailored-resume-document";

const context: TailorContext = {
  source: resumeFixture("en"),
  templateId: "v2",
  targetLocale: "en",
  uiLocale: "es",
  jobDescription: "Buscamos desarrollador con experiencia en React y SQL.",
};
const response = {
  schemaVersion: 1,
  locale: "en",
  aiScore: 90,
  matchAnalysis: {
    scoreBreakdown: {
      technologies: {
        score: 18,
        evidence: "Selected CMS evidence supports this dimension.",
      },
      experience: {
        score: 18,
        evidence: "Selected CMS evidence supports this dimension.",
      },
      operations: {
        score: 18,
        evidence: "Selected CMS evidence supports this dimension.",
      },
      collaboration: {
        score: 18,
        evidence: "Selected CMS evidence supports this dimension.",
      },
      prerequisites: {
        score: 18,
        evidence: "Selected CMS evidence supports this dimension.",
      },
    },
    strengths: ["Relevant delivery supported by the selected experience."],
  },
  selection: resumeSelectionFixture(context.source),
  fields: resumeTextFields(context.source, "v2").map(({ id, text }) => ({
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
  it("accepts arbitrary verbatim names from discovery and drops invented matches", async () => {
    const create = jest
      .fn()
      .mockResolvedValue(
        completion({ vacancyTechnologies: ["quiet oak", "invented product"] }),
      );
    jest
      .mocked(OpenAI)
      .mockImplementation(
        () => ({ chat: { completions: { create } } }) as never,
      );
    await expect(
      discoverVacancyTechnologies("We automate releases with quiet oak.", {
        keys: {},
        defaultProvider: null,
      }),
    ).resolves.toEqual(["quiet oak"]);
  });
  it("keeps the explicit CV locale distinct from the interface and job locale", () => {
    const prompt = buildTailoredResumePrompt({
      ...context,
      source: {
        ...context.source,
        experiences: context.source.experiences.map((experience) => ({
          ...experience,
          technologyIds: ["skill-react"],
          technologies: ["React"],
        })),
      },
    });
    const input = decode(prompt.userPrompt) as {
      targetLocale: string;
      uiLocale: string;
      promptVersion: string;
      responseContract: { fields: unknown[] };
      facts: {
        experiences: unknown[];
        skills: unknown[];
        technologies: { id: string; name: string }[];
      };
      source: { locale: string; fields: { id: string; text: string }[] };
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
    expect(input.responseContract.fields).toEqual([
      { id: "SOURCE_FIELD_ID", text: "Selected visible text" },
    ]);
    expect(input.responseContract).not.toHaveProperty("fieldsRule");
    expect(prompt.userPrompt).toContain("experience.exp-0.bullet.resp-0-1");
    const source = input.source;
    expect(input.facts.experiences[0]).not.toHaveProperty("responsibilities");
    expect(input.facts.experiences[0]).toMatchObject({
      technologyIds: ["skill-react"],
    });
    expect(input.facts.experiences[0]).not.toHaveProperty("technologies");
    expect(source.locale).toBe("en");
    expect(input).not.toHaveProperty("sources");
    expect(prompt.userPrompt).not.toContain(resumeFixture("es").header.summary);
    expect(
      input.facts.technologies.filter(({ id }) => id === "skill-react"),
    ).toEqual([{ id: "skill-react", name: "React" }]);
    expect(input.facts.skills[0]).toMatchObject({
      skillIds: ["skill-react", "skill-typescript", "skill-next"],
    });
    expect(input.promptVersion).toBe(TAILORED_RESUME_PROMPT_VERSION);
    expect(source.fields).toContainEqual(
      expect.objectContaining({
        id: "experience.exp-0.bullet.resp-0-1",
        text: context.source.experiences[0].responsibilities[0],
      }),
    );
    expect(
      source.fields.some(
        (field: { id: string }) => field.id === "header.fullName",
      ),
    ).toBe(false);
    expect(prompt.systemPrompt).toContain(
      "Never equate general professional English proficiency with CEFR C1",
    );
    expect(prompt.systemPrompt).toContain(
      "mirror the exact naming, casing, and phrasing used in the job description",
    );
  });
  it.each([
    ["v1", 4],
    ["v2", 5],
  ] as const)(
    "requests an auditable coverage report for %s",
    (templateId, limit) => {
      const prompt = buildTailoredResumePrompt({ ...context, templateId });
      const input = decode(prompt.userPrompt) as {
        layoutLimits: { maxBulletsPerExperience: number };
      };
      expect(input.layoutLimits.maxBulletsPerExperience).toBe(limit);
      expect(prompt.systemPrompt).toContain(
        "Account for every omitted CMS achievement ID",
      );
      expect(prompt.systemPrompt).toContain(
        "Keep retained responsibilityIds in CMS order",
      );
      expect(prompt.systemPrompt).toContain("ANALYSIS AND COVERAGE");
    },
  );
  it("describes available page space without fixed role counts", () => {
    const prompt = buildTailoredResumePrompt(context);
    const input = decode(prompt.userPrompt) as {
      layoutLimits: { pages: unknown[] };
    };
    expect(input.layoutLimits.pages).toEqual([
      {
        page: 1,
        charactersPerLine: 76,
        maxLines: 46,
        maxCharacters: 3400,
        includesSummary: true,
      },
      {
        page: 2,
        charactersPerLine: 112,
        maxLines: 60,
        maxCharacters: 5200,
        includesSummary: false,
      },
    ]);
    expect(prompt.systemPrompt).toContain(
      "Never shorten first-page achievements to solve overflow on a continuation page",
    );
    expect(prompt.systemPrompt).toContain(
      "Condense a retained achievement only when its text exceeds its field budget or its assigned page exceeds a layout limit.",
    );
    expect(prompt.systemPrompt).toContain(
      "Keep each value attached to the same subject, outcome and qualifier.",
    );
    expect(prompt.systemPrompt).toContain(
      "Preserve every clause with a numeric fact.",
    );
    expect(prompt.systemPrompt).toContain(
      "Before returning fields, compare each retained achievement with the CMS text for the same ID.",
    );
  });
  it("produces exactly the document accepted by manual validation", async () => {
    const vacancy = { ...context, jobDescription: "Experiencia con React.js." };
    const withDisplayName = {
      ...response,
      technologyNames: [{ skillId: "skill-react", name: "React.js" }],
    };
    const create = jest.fn().mockResolvedValue(completion(withDisplayName));
    jest
      .mocked(OpenAI)
      .mockImplementation(
        () => ({ chat: { completions: { create } } }) as never,
      );
    const automatic = await tailorResumeDocument(vacancy, {
      keys: {},
      defaultProvider: null,
    });
    expect(automatic.document.skills[0].items).toContain("React.js");
    expect(automatic.document).toEqual(
      validateTailoredResume(withDisplayName, vacancy).document,
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
  it("formats targeted correction instructions when fields exceed text budget", async () => {
    const oversizedSummary = "A".repeat(700);
    const oversizedFields = response.fields.map((f) =>
      f.id === "header.summary" ? { ...f, text: oversizedSummary } : f,
    );
    const create = jest
      .fn()
      .mockResolvedValueOnce(
        completion({ ...response, fields: oversizedFields }),
      )
      .mockResolvedValueOnce(completion(response));
    jest
      .mocked(OpenAI)
      .mockImplementation(
        () => ({ chat: { completions: { create } } }) as never,
      );
    const result = await tailorResumeDocument(context, {
      keys: {},
      defaultProvider: null,
    });
    expect(result.document.locale).toBe("en");
    expect(create).toHaveBeenCalledTimes(2);
    const retryRequest = (
      create.mock.calls as [{ messages: { content: string }[] }][]
    )[1][0];
    const retryContent = retryRequest.messages[1].content;
    expect(retryContent).toContain("CRITICAL BUDGET VIOLATION");
    expect(retryContent).toContain("header.summary: length 700 > budget 650");
    expect(retryContent).toContain(
      "acorta solo ese campo, conserva métricas y requiredCoverage",
    );
  });
  it("appends confirmedTechnologies to skills and includes them in prompt facts", async () => {
    const vacancyWithConfirmed = {
      ...context,
      confirmedTechnologies: ["SQL", ".NET Core"],
    };
    const prompt = buildTailoredResumePrompt(vacancyWithConfirmed);
    const input = decode(prompt.userPrompt) as {
      confirmedTechnologies: string[];
    };
    expect(input.confirmedTechnologies).toEqual(["SQL", ".NET Core"]);

    const create = jest.fn().mockResolvedValue(completion(response));
    jest
      .mocked(OpenAI)
      .mockImplementation(
        () => ({ chat: { completions: { create } } }) as never,
      );
    const tailored = await tailorResumeDocument(vacancyWithConfirmed, {
      keys: {},
      defaultProvider: null,
    });
    const allSkillItems = tailored.document.skills.flatMap((s) => s.items);
    expect(allSkillItems).toContain("SQL");
    expect(allSkillItems).toContain(".NET Core");
  });
});
