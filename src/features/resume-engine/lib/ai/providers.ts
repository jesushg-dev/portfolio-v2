import { TRPCError } from "@trpc/server";

import { env } from "@/env";

import type { AiProviderName } from "@/features/resume-engine/lib/ai/provider-types";

export type { AiProviderName };

export const AI_PROVIDER_LABELS: Record<AiProviderName, string> = {
  claude: "Claude (Anthropic)",
  openai: "OpenAI",
  deepseek: "DeepSeek",
  gemini: "Gemini",
};

export const AI_PROVIDER_MODELS: Record<AiProviderName, string> = {
  claude: "claude-sonnet-4-5",
  openai: "gpt-4o",
  deepseek: "deepseek-chat",
  gemini: "gemini-2.0-flash",
};

export interface AiProviderOption {
  id: AiProviderName;
  label: string;
  model: string;
}

export function getAvailableAiProviders(): AiProviderOption[] {
  const providers: AiProviderName[] = [];
  if (env.ANTHROPIC_API_KEY) providers.push("claude");
  if (env.OPENAI_API_KEY) providers.push("openai");
  if (env.GEMINI_API_KEY) providers.push("gemini");
  if (env.DEEPSEEK_API_KEY) providers.push("deepseek");

  return providers.map((id) => ({
    id,
    label: AI_PROVIDER_LABELS[id],
    model: AI_PROVIDER_MODELS[id],
  }));
}

export function getDefaultAiProvider(): AiProviderName | null {
  const available = getAvailableAiProviders();
  const configured = env.DEFAULT_AI_PROVIDER;
  if (configured && available.some((provider) => provider.id === configured)) {
    return configured;
  }
  return available[0]?.id ?? null;
}

export function resolveAiProvider(providerName?: string): AiProviderName {
  const available = getAvailableAiProviders();
  if (available.length === 0) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "No AI provider configured. Use manual mode or set an API key in the environment.",
    });
  }

  const candidate = providerName as AiProviderName | undefined;
  if (candidate && available.some((provider) => provider.id === candidate)) {
    return candidate;
  }

  const defaultProvider = getDefaultAiProvider();
  if (!defaultProvider) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No AI provider available.",
    });
  }

  return defaultProvider;
}
