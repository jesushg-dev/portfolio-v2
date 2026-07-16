import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import { env } from "@/env";
import type { CvSection } from "@/lib/types";
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
} from "@/features/resume-engine/lib/ai/prompt-package";
import type { CvImportDraft } from "@/features/resume-engine/lib/cv-import-draft";
import {
  CvDocxTailorResultSchema,
  type CvDocxTailorResult,
} from "@/features/resume-engine/lib/cv-docx-tailor-result";

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

  return { result, provider };
}
