import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";
import { buildInterviewPrepSystemPrompt } from "@/features/resume-engine/lib/ai/interview-prep-prompt";
import {
  buildInterviewPrepUserPrompt,
  type InterviewPrepPromptMeta,
} from "@/features/resume-engine/lib/ai/interview-prep-prompt-package";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  requireTenantAiApiKey,
  resolveAiProvider,
  type AiProviderName,
  type TenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import {
  InterviewPrepResultSchema,
  type InterviewPrepResult,
} from "@/features/resume-engine/lib/interview-prep-result";

const MAX_TOKENS = 8192;

async function completeJson(
  systemPrompt: string,
  userPrompt: string,
  credentials: TenantAiCredentials,
  providerName?: string,
): Promise<{ result: InterviewPrepResult; provider: AiProviderName }> {
  const provider = resolveAiProvider(credentials, providerName);
  let result: InterviewPrepResult;

  switch (provider) {
    case "claude": {
      const client = new Anthropic({
        apiKey: requireTenantAiApiKey(credentials, "claude"),
      });
      const response = await client.messages.create({
        model: AI_PROVIDER_MODELS.claude,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      result = InterviewPrepResultSchema.parse(parseAiJsonResponse(text));
      break;
    }
    case "openai":
    case "deepseek": {
      const isDeepseek = provider === "deepseek";
      const client = new OpenAI({
        apiKey: requireTenantAiApiKey(
          credentials,
          isDeepseek ? "deepseek" : "openai",
        ),
        ...(isDeepseek ? { baseURL: "https://api.deepseek.com" } : {}),
      });
      const response = await client.chat.completions.create({
        model: isDeepseek
          ? AI_PROVIDER_MODELS.deepseek
          : AI_PROVIDER_MODELS.openai,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const text = response.choices[0]?.message?.content ?? "{}";
      result = InterviewPrepResultSchema.parse(parseAiJsonResponse(text));
      break;
    }
    case "gemini": {
      const client = new GoogleGenAI({
        apiKey: requireTenantAiApiKey(credentials, "gemini"),
      });
      const response = await client.models.generateContent({
        model: AI_PROVIDER_MODELS.gemini,
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        config: { responseMimeType: "application/json" },
      });
      result = InterviewPrepResultSchema.parse(
        parseAiJsonResponse(response.text ?? "{}"),
      );
      break;
    }
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }

  return { result, provider };
}

export async function generateInterviewPrepPack(
  draft: CvImportDraft,
  jobDescription: string,
  matchAnalysis: CvMatchAnalysis | null,
  meta: InterviewPrepPromptMeta,
  credentials: TenantAiCredentials,
  providerName?: string,
): Promise<{ result: InterviewPrepResult; provider: AiProviderName }> {
  const append = Boolean(meta.existingQuestions?.length);
  const systemPrompt = buildInterviewPrepSystemPrompt(
    meta.eventType,
    append,
    meta.focusTools ?? [],
  );
  const userPrompt = buildInterviewPrepUserPrompt(
    draft,
    jobDescription,
    matchAnalysis,
    meta,
  );
  return completeJson(systemPrompt, userPrompt, credentials, providerName);
}
