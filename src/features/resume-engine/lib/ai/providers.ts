import { TRPCError } from "@trpc/server";

import {
  getTenantIntegrationConfig,
  type AiIntegrationConfig,
} from "@/lib/integrations/tenant-integrations-service";

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
  gemini: "gemini-3.6-flash",
};

export interface AiProviderOption {
  id: AiProviderName;
  label: string;
  model: string;
}

/** Per-tenant AI keys — never fall back to platform `.env` keys. */
export interface TenantAiCredentials {
  keys: Partial<Record<AiProviderName, string>>;
  defaultProvider: AiProviderName | null;
}

type AiConfigDefaultProvider = NonNullable<
  AiIntegrationConfig["defaultProvider"]
>;

function mapConfigDefaultProvider(
  value: AiConfigDefaultProvider | undefined,
): AiProviderName | null {
  switch (value) {
    case "anthropic":
      return "claude";
    case "openai":
      return "openai";
    case "gemini":
      return "gemini";
    case "deepseek":
      return "deepseek";
    case undefined:
      return null;
    default: {
      const exhaustiveCheck: never = value;
      void exhaustiveCheck;
      return null;
    }
  }
}

export function credentialsFromAiConfig(
  config: AiIntegrationConfig | null,
): TenantAiCredentials {
  if (!config) {
    return { keys: {}, defaultProvider: null };
  }

  const keys: Partial<Record<AiProviderName, string>> = {};
  const anthropic = config.anthropicApiKey?.trim();
  const openai = config.openaiApiKey?.trim();
  const gemini = config.geminiApiKey?.trim();
  const deepseek = config.deepseekApiKey?.trim();

  if (anthropic) keys.claude = anthropic;
  if (openai) keys.openai = openai;
  if (gemini) keys.gemini = gemini;
  if (deepseek) keys.deepseek = deepseek;

  const mappedDefault = mapConfigDefaultProvider(config.defaultProvider);
  const available = (
    ["claude", "openai", "gemini", "deepseek"] as const
  ).filter((id) => Boolean(keys[id]));
  const defaultProvider =
    mappedDefault && keys[mappedDefault]
      ? mappedDefault
      : (available[0] ?? null);

  return { keys, defaultProvider };
}

export async function loadTenantAiCredentials(
  userId: string,
): Promise<TenantAiCredentials> {
  const config = await getTenantIntegrationConfig(userId, "ai");
  return credentialsFromAiConfig(config);
}

export function getAvailableAiProviders(
  credentials: TenantAiCredentials,
): AiProviderOption[] {
  const order: AiProviderName[] = ["claude", "openai", "gemini", "deepseek"];
  return order
    .filter((id) => Boolean(credentials.keys[id]))
    .map((id) => ({
      id,
      label: AI_PROVIDER_LABELS[id],
      model: AI_PROVIDER_MODELS[id],
    }));
}

export function getDefaultAiProvider(
  credentials: TenantAiCredentials,
): AiProviderName | null {
  const available = getAvailableAiProviders(credentials);
  if (
    credentials.defaultProvider &&
    available.some((provider) => provider.id === credentials.defaultProvider)
  ) {
    return credentials.defaultProvider;
  }
  return available[0]?.id ?? null;
}

export function resolveAiProvider(
  credentials: TenantAiCredentials,
  providerName?: string,
): AiProviderName {
  const available = getAvailableAiProviders(credentials);
  if (available.length === 0) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "No AI provider configured. Connect AI keys in Admin → Credentials, or use manual mode.",
    });
  }

  const candidate = providerName as AiProviderName | undefined;
  if (candidate && available.some((provider) => provider.id === candidate)) {
    return candidate;
  }

  const defaultProvider = getDefaultAiProvider(credentials);
  if (!defaultProvider) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "No AI provider available. Connect AI keys in Admin → Credentials.",
    });
  }

  return defaultProvider;
}

export function requireTenantAiApiKey(
  credentials: TenantAiCredentials,
  provider: AiProviderName,
): string {
  const key = credentials.keys[provider]?.trim();
  if (!key) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `AI provider "${provider}" has no API key. Connect it in Admin → Credentials.`,
    });
  }
  return key;
}
