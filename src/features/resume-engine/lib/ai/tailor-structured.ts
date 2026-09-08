import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  CvTailorResultSchema,
  type CvTailorResult,
} from "@/features/resume-engine/lib/cv-tailor-result";
import { TAILOR_SYSTEM_PROMPT } from "@/features/resume-engine/lib/ai/tailor-prompt";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  requireTenantAiApiKey,
  resolveAiProvider,
  type AiProviderName,
  type TenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import { buildTailorUserPrompt } from "@/features/resume-engine/lib/ai/prompt-package";
import type { TailorJobContext } from "@/features/resume-engine/lib/ai/tailor-job-context";

async function tailorWithClaude(
  draft: CvImportDraft,
  jobDescription: string,
  apiKey: string,
  jobContext?: TailorJobContext | null,
): Promise<CvTailorResult> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: AI_PROVIDER_MODELS.claude,
    max_tokens: 8192,
    system: TAILOR_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildTailorUserPrompt(draft, jobDescription, jobContext),
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
  apiKey: string,
  baseURL?: string,
  model = AI_PROVIDER_MODELS.openai,
  jobContext?: TailorJobContext | null,
): Promise<CvTailorResult> {
  const client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: TAILOR_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildTailorUserPrompt(draft, jobDescription, jobContext),
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return CvTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function tailorWithGemini(
  draft: CvImportDraft,
  jobDescription: string,
  apiKey: string,
  jobContext?: TailorJobContext | null,
): Promise<CvTailorResult> {
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: AI_PROVIDER_MODELS.gemini,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${TAILOR_SYSTEM_PROMPT}\n\n${buildTailorUserPrompt(draft, jobDescription, jobContext)}`,
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
  credentials: TenantAiCredentials,
  providerName?: string,
  jobContext?: TailorJobContext | null,
): Promise<{ result: CvTailorResult; provider: AiProviderName }> {
  const provider = resolveAiProvider(credentials, providerName);

  let result: CvTailorResult;
  switch (provider) {
    case "claude":
      result = await tailorWithClaude(
        draft,
        jobDescription,
        requireTenantAiApiKey(credentials, "claude"),
        jobContext,
      );
      break;
    case "openai":
      result = await tailorWithOpenAI(
        draft,
        jobDescription,
        requireTenantAiApiKey(credentials, "openai"),
        undefined,
        AI_PROVIDER_MODELS.openai,
        jobContext,
      );
      break;
    case "deepseek":
      result = await tailorWithOpenAI(
        draft,
        jobDescription,
        requireTenantAiApiKey(credentials, "deepseek"),
        "https://api.deepseek.com",
        AI_PROVIDER_MODELS.deepseek,
        jobContext,
      );
      break;
    case "gemini":
      result = await tailorWithGemini(
        draft,
        jobDescription,
        requireTenantAiApiKey(credentials, "gemini"),
        jobContext,
      );
      break;
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }

  return { result, provider };
}
