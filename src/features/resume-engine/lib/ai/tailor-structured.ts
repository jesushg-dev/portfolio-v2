import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import { env } from "@/env";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  CvTailorResultSchema,
  type CvTailorResult,
} from "@/features/resume-engine/lib/cv-tailor-result";
import { TAILOR_SYSTEM_PROMPT } from "@/features/resume-engine/lib/ai/tailor-prompt";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  resolveAiProvider,
  type AiProviderName,
} from "@/features/resume-engine/lib/ai/providers";
import { buildTailorUserPrompt } from "@/features/resume-engine/lib/ai/prompt-package";

async function tailorWithClaude(
  draft: CvImportDraft,
  jobDescription: string,
): Promise<CvTailorResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: AI_PROVIDER_MODELS.claude,
    max_tokens: 8192,
    system: TAILOR_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildTailorUserPrompt(draft, jobDescription),
      },
    ],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return CvTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function tailorWithOpenAI(
  draft: CvImportDraft,
  jobDescription: string,
  baseURL?: string,
  apiKey?: string,
  model = AI_PROVIDER_MODELS.openai,
): Promise<CvTailorResult> {
  const client = new OpenAI({
    apiKey: apiKey ?? env.OPENAI_API_KEY,
    ...(baseURL ? { baseURL } : {}),
  });
  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: TAILOR_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildTailorUserPrompt(draft, jobDescription),
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return CvTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function tailorWithGemini(
  draft: CvImportDraft,
  jobDescription: string,
): Promise<CvTailorResult> {
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  const response = await client.models.generateContent({
    model: AI_PROVIDER_MODELS.gemini,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${TAILOR_SYSTEM_PROMPT}\n\n${buildTailorUserPrompt(draft, jobDescription)}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  return CvTailorResultSchema.parse(parseAiJsonResponse(text));
}

export async function tailorStructuredResume(
  draft: CvImportDraft,
  jobDescription: string,
  providerName?: string,
): Promise<{ result: CvTailorResult; provider: AiProviderName }> {
  const provider = resolveAiProvider(providerName);

  let result: CvTailorResult;
  switch (provider) {
    case "claude":
      result = await tailorWithClaude(draft, jobDescription);
      break;
    case "openai":
      result = await tailorWithOpenAI(draft, jobDescription);
      break;
    case "deepseek":
      result = await tailorWithOpenAI(
        draft,
        jobDescription,
        "https://api.deepseek.com",
        env.DEEPSEEK_API_KEY,
        AI_PROVIDER_MODELS.deepseek,
      );
      break;
    case "gemini":
      result = await tailorWithGemini(draft, jobDescription);
      break;
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }

  return { result, provider };
}
