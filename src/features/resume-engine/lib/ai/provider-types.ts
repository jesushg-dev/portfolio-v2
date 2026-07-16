export type AiProviderName = "claude" | "openai" | "deepseek" | "gemini";

export function isAiProviderName(value: string): value is AiProviderName {
  return (
    value === "claude" ||
    value === "openai" ||
    value === "deepseek" ||
    value === "gemini"
  );
}
