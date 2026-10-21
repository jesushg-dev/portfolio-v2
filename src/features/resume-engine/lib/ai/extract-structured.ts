import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import {
  CvImportDraftSchema,
  type CvImportDraft,
  type CvImportTextSection,
} from "@/features/cv/lib/cv-import-draft";
import { IMPORT_SYSTEM_PROMPT } from "@/features/resume-engine/lib/ai/import-prompt";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  requireTenantAiApiKey,
  resolveAiProvider,
  type AiProviderName,
  type TenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import { buildImportUserPrompt } from "@/features/resume-engine/lib/ai/prompt-package";

async function extractWithClaude(
  sections: CvImportTextSection[],
  apiKey: string,
): Promise<CvImportDraft> {
  const client = new Anthropic({ apiKey });
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
  apiKey: string,
  baseURL?: string,
  model = AI_PROVIDER_MODELS.openai,
): Promise<CvImportDraft> {
  const client = new OpenAI({
    apiKey,
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
  apiKey: string,
): Promise<CvImportDraft> {
  const client = new GoogleGenAI({ apiKey });
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
  credentials: TenantAiCredentials,
  providerName?: string,
): Promise<{ draft: CvImportDraft; provider: AiProviderName }> {
  const provider = resolveAiProvider(credentials, providerName);

  let draft: CvImportDraft;
  switch (provider) {
    case "claude":
      draft = await extractWithClaude(
        sections,
        requireTenantAiApiKey(credentials, "claude"),
      );
      break;
    case "openai":
      draft = await extractWithOpenAI(
        sections,
        requireTenantAiApiKey(credentials, "openai"),
      );
      break;
    case "deepseek":
      draft = await extractWithOpenAI(
        sections,
        requireTenantAiApiKey(credentials, "deepseek"),
        "https://api.deepseek.com",
        AI_PROVIDER_MODELS.deepseek,
      );
      break;
    case "gemini":
      draft = await extractWithGemini(
        sections,
        requireTenantAiApiKey(credentials, "gemini"),
      );
      break;
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }

  return { draft, provider };
}
