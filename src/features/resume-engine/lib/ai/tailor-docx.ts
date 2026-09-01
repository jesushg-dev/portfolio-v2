import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import { env } from "@/env";
import type { CvSection } from "@/lib/types";
import { isDocxTitleStyle } from "@/lib/docx/parser";
import {
  DOCX_TAILOR_SYSTEM_PROMPT,
  STUDIO_DOCX_TAILOR_SYSTEM_PROMPT,
} from "@/features/resume-engine/lib/ai/docx-tailor-prompt";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  resolveAiProvider,
  type AiProviderName,
} from "@/features/resume-engine/lib/ai/providers";
import {
  buildDocxTailorUserPrompt,
  buildStudioDocxTailorUserPrompt,
  buildShrinkPromptPackage,
  type ShrinkFragment,
} from "@/features/resume-engine/lib/ai/prompt-package";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  CvDocxTailorResultSchema,
  type CvDocxTailorResult,
} from "@/features/resume-engine/lib/cv-docx-tailor-result";
import { skillAlignedBudget } from "@/features/resume-engine/lib/ai/skill-chip-budget";
import {
  ShrinkResultSchema,
  type ShrinkResult,
} from "@/features/resume-engine/lib/ai/shrink-result";

async function tailorDocxWithClaude(
  sections: CvSection[],
  jobDescription: string,
  draft?: CvImportDraft,
): Promise<CvDocxTailorResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const systemPrompt = draft
    ? STUDIO_DOCX_TAILOR_SYSTEM_PROMPT
    : DOCX_TAILOR_SYSTEM_PROMPT;
  const userPrompt = draft
    ? buildStudioDocxTailorUserPrompt(sections, draft, jobDescription)
    : buildDocxTailorUserPrompt(sections, jobDescription);

  const response = await client.messages.create({
    model: AI_PROVIDER_MODELS.claude,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return CvDocxTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function tailorDocxWithOpenAI(
  sections: CvSection[],
  jobDescription: string,
  draft?: CvImportDraft,
  baseURL?: string,
  apiKey?: string,
  model = AI_PROVIDER_MODELS.openai,
): Promise<CvDocxTailorResult> {
  const client = new OpenAI({
    apiKey: apiKey ?? env.OPENAI_API_KEY,
    ...(baseURL ? { baseURL } : {}),
  });
  const systemPrompt = draft
    ? STUDIO_DOCX_TAILOR_SYSTEM_PROMPT
    : DOCX_TAILOR_SYSTEM_PROMPT;
  const userPrompt = draft
    ? buildStudioDocxTailorUserPrompt(sections, draft, jobDescription)
    : buildDocxTailorUserPrompt(sections, jobDescription);

  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return CvDocxTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function tailorDocxWithGemini(
  sections: CvSection[],
  jobDescription: string,
  draft?: CvImportDraft,
): Promise<CvDocxTailorResult> {
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  const systemPrompt = draft
    ? STUDIO_DOCX_TAILOR_SYSTEM_PROMPT
    : DOCX_TAILOR_SYSTEM_PROMPT;
  const userPrompt = draft
    ? buildStudioDocxTailorUserPrompt(sections, draft, jobDescription)
    : buildDocxTailorUserPrompt(sections, jobDescription);

  const response = await client.models.generateContent({
    model: AI_PROVIDER_MODELS.gemini,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\n${userPrompt}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  return CvDocxTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function shrinkWithClaude(
  fragments: ShrinkFragment[],
): Promise<ShrinkResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const { systemPrompt, userPrompt } = buildShrinkPromptPackage(fragments);

  const response = await client.messages.create({
    model: AI_PROVIDER_MODELS.claude,
    max_tokens: 2048,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return ShrinkResultSchema.parse(parseAiJsonResponse(text));
}

async function shrinkWithOpenAI(
  fragments: ShrinkFragment[],
  baseURL?: string,
  apiKey?: string,
  model = AI_PROVIDER_MODELS.openai,
): Promise<ShrinkResult> {
  const client = new OpenAI({
    apiKey: apiKey ?? env.OPENAI_API_KEY,
    ...(baseURL ? { baseURL } : {}),
  });
  const { systemPrompt, userPrompt } = buildShrinkPromptPackage(fragments);

  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return ShrinkResultSchema.parse(parseAiJsonResponse(text));
}

async function shrinkWithGemini(
  fragments: ShrinkFragment[],
): Promise<ShrinkResult> {
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  const { systemPrompt, userPrompt } = buildShrinkPromptPackage(fragments);

  const response = await client.models.generateContent({
    model: AI_PROVIDER_MODELS.gemini,
    contents: [
      { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const text = response.text ?? "{}";
  return ShrinkResultSchema.parse(parseAiJsonResponse(text));
}

async function shrinkOverflowingRuns(
  provider: AiProviderName,
  fragments: ShrinkFragment[],
): Promise<ShrinkResult> {
  switch (provider) {
    case "claude":
      return shrinkWithClaude(fragments);
    case "openai":
      return shrinkWithOpenAI(fragments);
    case "deepseek":
      return shrinkWithOpenAI(
        fragments,
        "https://api.deepseek.com",
        env.DEEPSEEK_API_KEY,
        AI_PROVIDER_MODELS.deepseek,
      );
    case "gemini":
      return shrinkWithGemini(fragments);
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }
}

const SHRINK_TRIGGER_TOLERANCE = 1.1;
const MAX_SHRINK_ATTEMPTS = 2;

function collectBudgets(sections: CvSection[]): Map<string, number> {
  const budgets = new Map<string, number>();
  for (const section of sections) {
    for (const paragraph of section.paragraphs) {
      if (isDocxTitleStyle(paragraph.style)) continue;
      for (const run of paragraph.runs) {
        budgets.set(run.id, skillAlignedBudget(run.text));
      }
    }
  }
  return budgets;
}

function findOverflows(
  original: CvSection[],
  tailored: CvDocxTailorResult,
  tolerance = SHRINK_TRIGGER_TOLERANCE,
): ShrinkFragment[] {
  const budgets = collectBudgets(original);
  const overflows: ShrinkFragment[] = [];

  for (const section of tailored.sections) {
    for (const paragraph of section.paragraphs) {
      for (const run of paragraph.runs) {
        const budget = budgets.get(run.id);
        if (budget !== undefined && run.text.length > budget * tolerance) {
          overflows.push({ id: run.id, text: run.text, budget });
        }
      }
    }
  }
  return overflows;
}

function applyShrinkResult(
  tailored: CvDocxTailorResult,
  shrink: ShrinkResult,
): CvDocxTailorResult {
  const replacements = new Map(shrink.runs.map((r) => [r.id, r.text]));
  return {
    ...tailored,
    sections: tailored.sections.map((section) => ({
      ...section,
      paragraphs: section.paragraphs.map((paragraph) => ({
        ...paragraph,
        runs: paragraph.runs.map((run) =>
          replacements.has(run.id)
            ? { ...run, text: replacements.get(run.id)! }
            : run,
        ),
      })),
    })),
  };
}

function hardTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/**
 * Absolute last resort after shrink attempts: force every run within its
 * original budget so page overflow cannot slip through.
 */
function forceWithinBudget(
  original: CvSection[],
  tailored: CvDocxTailorResult,
): CvDocxTailorResult {
  const budgets = collectBudgets(original);
  return {
    ...tailored,
    sections: tailored.sections.map((section) => ({
      ...section,
      paragraphs: section.paragraphs.map((paragraph) => ({
        ...paragraph,
        runs: paragraph.runs.map((run) => {
          const budget = budgets.get(run.id);
          if (budget === undefined || run.text.length <= budget) return run;
          return { ...run, text: hardTruncate(run.text, budget) };
        }),
      })),
    })),
  };
}

export async function tailorDocxResume(
  sections: CvSection[],
  jobDescription: string,
  providerName?: string,
  draft?: CvImportDraft,
): Promise<{ result: CvDocxTailorResult; provider: AiProviderName }> {
  if (sections.length === 0) {
    throw new Error("No adaptable sections found in the DOCX.");
  }

  const provider = resolveAiProvider(providerName);

  let result: CvDocxTailorResult;
  switch (provider) {
    case "claude":
      result = await tailorDocxWithClaude(sections, jobDescription, draft);
      break;
    case "openai":
      result = await tailorDocxWithOpenAI(sections, jobDescription, draft);
      break;
    case "deepseek":
      result = await tailorDocxWithOpenAI(
        sections,
        jobDescription,
        draft,
        "https://api.deepseek.com",
        env.DEEPSEEK_API_KEY,
        AI_PROVIDER_MODELS.deepseek,
      );
      break;
    case "gemini":
      result = await tailorDocxWithGemini(sections, jobDescription, draft);
      break;
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }

  for (let attempt = 0; attempt < MAX_SHRINK_ATTEMPTS; attempt++) {
    const overflows = findOverflows(sections, result);
    if (overflows.length === 0) break;

    try {
      const shrink = await shrinkOverflowingRuns(provider, overflows);
      result = applyShrinkResult(result, shrink);
    } catch {
      break;
    }
  }

  result = forceWithinBudget(sections, result);

  return { result, provider };
}
