import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import { env } from "@/env";
import {
  CvImportDraftSchema,
  type CvImportDraft,
  type CvImportTextSection,
} from "@/features/cv/lib/cv-import-draft";
import { IMPORT_SYSTEM_PROMPT } from "@/features/resume-engine/lib/ai/import-prompt";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  resolveAiProvider,
  type AiProviderName,
} from "@/features/resume-engine/lib/ai/providers";
import { buildImportUserPrompt } from "@/features/resume-engine/lib/ai/prompt-package";

async function extractWithClaude(
  sections: CvImportTextSection[],
): Promise<CvImportDraft> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: AI_PROVIDER_MODELS.claude,
    max_tokens: 8192,
    system: IMPORT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildImportUserPrompt(sections),
      },
    ],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return CvImportDraftSchema.parse(parseAiJsonResponse(text));
}

async function extractWithOpenAI(
  sections: CvImportTextSection[],
  baseURL?: string,
  apiKey?: string,
  model = AI_PROVIDER_MODELS.openai,
): Promise<CvImportDraft> {
  const client = new OpenAI({
    apiKey: apiKey ?? env.OPENAI_API_KEY,
    ...(baseURL ? { baseURL } : {}),
  });
  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: IMPORT_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildImportUserPrompt(sections),
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return CvImportDraftSchema.parse(parseAiJsonResponse(text));
}

async function extractWithGemini(
  sections: CvImportTextSection[],
): Promise<CvImportDraft> {
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  const response = await client.models.generateContent({
    model: AI_PROVIDER_MODELS.gemini,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${IMPORT_SYSTEM_PROMPT}\n\n${buildImportUserPrompt(sections)}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  return CvImportDraftSchema.parse(parseAiJsonResponse(text));
}

export async function extractStructuredResume(
  sections: CvImportTextSection[],
  providerName?: string,
): Promise<{ draft: CvImportDraft; provider: AiProviderName }> {
  const provider = resolveAiProvider(providerName);

  let draft: CvImportDraft;
  switch (provider) {
    case "claude":
      draft = await extractWithClaude(sections);
      break;
    case "openai":
      draft = await extractWithOpenAI(sections);
      break;
    case "deepseek":
      draft = await extractWithOpenAI(
        sections,
        "https://api.deepseek.com",
        env.DEEPSEEK_API_KEY,
        AI_PROVIDER_MODELS.deepseek,
      );
      break;
    case "gemini":
      draft = await extractWithGemini(sections);
      break;
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }

  return { draft, provider };
}
