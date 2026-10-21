import {
  credentialsFromAiConfig,
  getAvailableAiProviders,
  getDefaultAiProvider,
  requireTenantAiApiKey,
  resolveAiProvider,
} from "@/features/resume-engine/lib/ai/providers";

describe("tenant AI credentials", () => {
  it("maps config keys without platform env fallback", () => {
    const credentials = credentialsFromAiConfig({
      openaiApiKey: " sk-test ",
      defaultProvider: "openai",
    });

    expect(credentials.keys).toEqual({ openai: "sk-test" });
    expect(getAvailableAiProviders(credentials)).toEqual([
      {
        id: "openai",
        label: "OpenAI",
        model: "gpt-4o",
      },
    ]);
    expect(getDefaultAiProvider(credentials)).toBe("openai");
  });

  it("maps anthropic default to claude", () => {
    const credentials = credentialsFromAiConfig({
      anthropicApiKey: "sk-ant",
      geminiApiKey: "gem",
      defaultProvider: "anthropic",
    });

    expect(resolveAiProvider(credentials)).toBe("claude");
    expect(requireTenantAiApiKey(credentials, "claude")).toBe("sk-ant");
  });

  it("rejects when the tenant has no AI keys", () => {
    const credentials = credentialsFromAiConfig(null);
    expect(() => resolveAiProvider(credentials)).toThrow(/Admin → Credentials/);
  });
});
