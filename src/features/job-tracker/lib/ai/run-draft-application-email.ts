import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import { env } from "@/env";
import {
  ApplicationEmailDraftSchema,
  buildApplicationEmailSystemPrompt,
  buildApplicationEmailUserPrompt,
  resolveApplyToEmail,
  type ApplicationEmailDraft,
  type DraftApplicationEmailInput,
} from "@/features/job-tracker/lib/ai/draft-application-email";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  resolveAiProvider,
  type AiProviderName,
} from "@/features/resume-engine/lib/ai/providers";

async function completeJson(
  system: string,
  user: string,
  provider: AiProviderName,
): Promise<unknown> {
  switch (provider) {
    case "claude": {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: AI_PROVIDER_MODELS.claude,
        max_tokens: 2048,
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
        apiKey:
          provider === "deepseek" ? env.DEEPSEEK_API_KEY : env.OPENAI_API_KEY,
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
      const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
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

export async function draftApplicationEmailWithAi(
  input: DraftApplicationEmailInput,
  providerName?: string,
): Promise<{ draft: ApplicationEmailDraft; provider: AiProviderName }> {
  const provider = resolveAiProvider(providerName);
  const raw = await completeJson(
    buildApplicationEmailSystemPrompt(),
    buildApplicationEmailUserPrompt(input),
    provider,
  );
  const parsed = ApplicationEmailDraftSchema.parse(raw);
  const applyToEmail = resolveApplyToEmail(
    parsed,
    input.jobDescription,
    input.companyEmail,
  );

  return {
    provider,
    draft: {
      ...parsed,
      applyToEmail,
    },
  };
}
