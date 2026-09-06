import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import {
  ApplicationCoverLetterDraftSchema,
  buildApplicationCoverLetterSystemPrompt,
  buildApplicationCoverLetterUserPrompt,
  type ApplicationCoverLetterDraft,
  type DraftApplicationCoverLetterInput,
} from "@/features/job-tracker/lib/ai/draft-application-cover-letter";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  requireTenantAiApiKey,
  resolveAiProvider,
  type AiProviderName,
  type TenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";

async function completeJson(
  system: string,
  user: string,
  credentials: TenantAiCredentials,
  provider: AiProviderName,
): Promise<unknown> {
  switch (provider) {
    case "claude": {
      const client = new Anthropic({
        apiKey: requireTenantAiApiKey(credentials, "claude"),
      });
      const response = await client.messages.create({
        model: AI_PROVIDER_MODELS.claude,
        max_tokens: 3072,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      return parseAiJsonResponse(text);
    }
    case "openai":
    case "deepseek": {
      const client = new OpenAI({
        apiKey: requireTenantAiApiKey(
          credentials,
          provider === "deepseek" ? "deepseek" : "openai",
        ),
        ...(provider === "deepseek"
          ? { baseURL: "https://api.deepseek.com" }
          : {}),
      });
      const response = await client.chat.completions.create({
        model: AI_PROVIDER_MODELS[provider],
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      return parseAiJsonResponse(response.choices[0]?.message?.content ?? "{}");
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
            parts: [{ text: `${system}\n\n${user}` }],
          },
        ],
        config: { responseMimeType: "application/json" },
      });
      return parseAiJsonResponse(response.text ?? "{}");
    }
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }
}

export async function draftApplicationCoverLetterWithAi(
  input: DraftApplicationCoverLetterInput,
  credentials: TenantAiCredentials,
  providerName?: string,
): Promise<{ draft: ApplicationCoverLetterDraft; provider: AiProviderName }> {
  const provider = resolveAiProvider(credentials, providerName);
  const raw = await completeJson(
    buildApplicationCoverLetterSystemPrompt(),
    buildApplicationCoverLetterUserPrompt(input),
    credentials,
    provider,
  );

  return {
    provider,
    draft: ApplicationCoverLetterDraftSchema.parse(raw),
  };
}
