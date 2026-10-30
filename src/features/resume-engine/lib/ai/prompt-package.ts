import type { CvImportTextSection } from "@/features/cv/lib/cv-import-draft";
import { IMPORT_SYSTEM_PROMPT } from "./import-prompt";

export interface AiPromptPackage {
  systemPrompt: string;
  userPrompt: string;
  combinedPrompt: string;
}

export function buildCombinedPrompt(
  systemPrompt: string,
  userPrompt: string,
): string {
  return `SYSTEM:\n${systemPrompt}\n\n---\n\nUSER:\n${userPrompt}`;
}

export function buildImportUserPrompt(sections: CvImportTextSection[]): string {
  return `RESUME SECTIONS:\n${JSON.stringify(sections, null, 2)}\n\nReturn only the JSON object.`;
}

export function buildImportPromptPackage(
  sections: CvImportTextSection[],
): AiPromptPackage {
  const userPrompt = buildImportUserPrompt(sections);
  return {
    systemPrompt: IMPORT_SYSTEM_PROMPT,
    userPrompt,
    combinedPrompt: buildCombinedPrompt(IMPORT_SYSTEM_PROMPT, userPrompt),
  };
}
