import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import {
  AI_PROVIDER_MODELS,
  requireTenantAiApiKey,
  resolveAiProvider,
  type TenantAiCredentials,
  type AiProviderName,
} from "./providers";
import { parseAiJsonResponse } from "./parse-json-response";
import {
  validateTailoredResume,
  type TailorContext,
} from "../tailored-resume-document";
import type { AiPromptPackage } from "./prompt-package";
import { buildTailoredResumePrompt } from "./tailor-resume-prompt";

async function requestJson(
  provider: AiProviderName,
  key: string,
  prompt: AiPromptPackage,
): Promise<string> {
  let text: string;
  if (provider === "claude") {
    const response = await new Anthropic({ apiKey: key }).messages.create({
      model: AI_PROVIDER_MODELS.claude,
      max_tokens: 16000,
      system: prompt.systemPrompt,
      messages: [{ role: "user", content: prompt.userPrompt }],
    });
    text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  } else if (provider === "gemini") {
    const response = await new GoogleGenAI({
      apiKey: key,
    }).models.generateContent({
      model: AI_PROVIDER_MODELS.gemini,
      contents: `${prompt.systemPrompt}\n${prompt.userPrompt}`,
      config: { responseMimeType: "application/json" },
    });
    text = response.text ?? "{}";
  } else {
    const response = await new OpenAI({
      apiKey: key,
      ...(provider === "deepseek"
        ? { baseURL: "https://api.deepseek.com" }
        : {}),
    }).chat.completions.create({
      model: AI_PROVIDER_MODELS[provider],
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content: prompt.userPrompt },
      ],
    });
    text = response.choices[0]?.message?.content ?? "{}";
  }
  return text;
}

export async function tailorResumeDocument(
  context: TailorContext,
  credentials: TenantAiCredentials,
  providerName?: string,
) {
  const provider = resolveAiProvider(credentials, providerName);
  const key = requireTenantAiApiKey(credentials, provider);
  const prompt = buildTailoredResumePrompt(context);
  let correction = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await requestJson(provider, key, {
      ...prompt,
      userPrompt: prompt.userPrompt + correction,
    });
    try {
      return {
        ...validateTailoredResume(parseAiJsonResponse(raw), context),
        provider,
      };
    } catch (error) {
      if (attempt === 1) throw error;
      correction = `\nCorrect your previous response ${JSON.stringify(raw)}. Validation errors:\n${error instanceof Error ? error.message : String(error)}\nReturn the complete corrected JSON, never fall back to the source language.`;
    }
  }
  throw new Error("Resume generation did not complete");
}
