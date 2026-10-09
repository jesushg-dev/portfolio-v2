import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { CvImportTextSection } from "@/features/cv/lib/cv-import-draft";
import type { CvSection } from "@/lib/types";
import { isDocxTitleStyle } from "@/lib/docx/parser";
import { IMPORT_SYSTEM_PROMPT } from "@/features/resume-engine/lib/ai/import-prompt";
import {
  DOCX_TAILOR_SYSTEM_PROMPT,
  STUDIO_DOCX_TAILOR_SYSTEM_PROMPT,
  SHRINK_SYSTEM_PROMPT,
} from "@/features/resume-engine/lib/ai/docx-tailor-prompt";
import {
  formatTailorJobContext,
  type TailorJobContext,
} from "@/features/resume-engine/lib/ai/tailor-job-context";
import { formatJobDescriptionForPrompt } from "@/features/resume-engine/lib/ai/clean-job-description";

function appendJobContext(
  prompt: string,
  jobContext?: TailorJobContext | null,
): string {
  const block = formatTailorJobContext(jobContext);
  if (!block) return prompt;
  return `${prompt}\n\n${block}`;
}

export interface AiPromptPackage {
  systemPrompt: string;
  userPrompt: string;
  combinedPrompt: string;
}

export interface TailorPromptPayloadOptions {
  targetLocale?: string;
  uiLocale?: string;
  yearsOfExperience?: number;
  primary?: string;
  lowPriority?: string[];
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

/**
 * Stamps each run with a "budget" equal to the joined original length of its paragraph.
 * Title / headline paragraphs get ceil(1.2 * original length).
 * Locked paragraphs and runs are omitted from the LLM payload.
 */
export function withBudgets(sections: CvSection[]) {
  return sections
    .map((section) => ({
      id: section.id,
      heading: section.heading,
      paragraphs: section.paragraphs
        .filter((paragraph) => !paragraph.locked)
        .map((paragraph) => {
          const isHeadline = isDocxTitleStyle(paragraph.style);
          const paraLength = paragraph.runs.reduce(
            (sum, r) => sum + r.text.length,
            0,
          );
          const paraBudget = isHeadline
            ? Math.ceil(1.2 * paraLength)
            : paraLength;

          return {
            id: paragraph.id,
            style: paragraph.style,
            runs: paragraph.runs
              .filter((run) => !run.locked)
              .map((run) => {
                const runBudget =
                  paragraph.runs.length === 1
                    ? paraBudget
                    : isHeadline
                      ? Math.ceil(1.2 * run.text.length)
                      : run.text.length;
                return {
                  id: run.id,
                  text: run.text,
                  budget: runBudget,
                };
              }),
          };
        })
        .filter((paragraph) => paragraph.runs.length > 0),
    }))
    .filter((section) => section.paragraphs.length > 0);
}

function formatOptionsBlock(options?: TailorPromptPayloadOptions): string {
  if (!options) return "";
  const filtered: Record<string, unknown> = {};
  if (options.targetLocale) filtered.targetLocale = options.targetLocale;
  if (options.uiLocale) filtered.uiLocale = options.uiLocale;
  if (options.yearsOfExperience !== undefined)
    filtered.yearsOfExperience = options.yearsOfExperience;
  if (options.primary) filtered.primary = options.primary;
  if (options.lowPriority && options.lowPriority.length > 0)
    filtered.lowPriority = options.lowPriority;

  if (Object.keys(filtered).length === 0) return "";
  return `OPTIONS:\n${JSON.stringify(filtered, null, 2)}\n\n`;
}

export function buildDocxTailorUserPrompt(
  sections: CvSection[],
  jobDescription: string,
  jobContext?: TailorJobContext | null,
  options?: TailorPromptPayloadOptions,
): string {
  const optionsBlock = formatOptionsBlock(options);
  const formattedJd = formatJobDescriptionForPrompt(jobDescription);
  return appendJobContext(
    `${optionsBlock}ADAPTABLE SECTIONS:\n${JSON.stringify(withBudgets(sections), null, 2)}\n\n${formattedJd}\n\nReturn only the JSON object.`,
    jobContext,
  );
}

export function buildDocxTailorPromptPackage(
  sections: CvSection[],
  jobDescription: string,
  jobContext?: TailorJobContext | null,
  options?: TailorPromptPayloadOptions,
): AiPromptPackage {
  const userPrompt = buildDocxTailorUserPrompt(
    sections,
    jobDescription,
    jobContext,
    options,
  );
  return {
    systemPrompt: DOCX_TAILOR_SYSTEM_PROMPT,
    userPrompt,
    combinedPrompt: buildCombinedPrompt(DOCX_TAILOR_SYSTEM_PROMPT, userPrompt),
  };
}

export function buildStudioDocxTailorUserPrompt(
  sections: CvSection[],
  draft: CvImportDraft,
  jobDescription: string,
  jobContext?: TailorJobContext | null,
  options?: TailorPromptPayloadOptions,
): string {
  const optionsBlock = formatOptionsBlock(options);
  const formattedJd = formatJobDescriptionForPrompt(jobDescription);
  return appendJobContext(
    `${optionsBlock}DOCX TEMPLATE SECTIONS (preserve ids, paragraph ids, run ids; only change text of runs that change; "budget" is character limit):\n${JSON.stringify(withBudgets(sections), null, 2)}\n\nSTRUCTURED RESUME DATA (factual source from CMS — map into template paragraphs):\n${JSON.stringify(draft, null, 2)}\n\n${formattedJd}\n\nReturn only the JSON object.`,
    jobContext,
  );
}

export function buildStudioDocxTailorPromptPackage(
  sections: CvSection[],
  draft: CvImportDraft,
  jobDescription: string,
  jobContext?: TailorJobContext | null,
  options?: TailorPromptPayloadOptions,
): AiPromptPackage {
  const userPrompt = buildStudioDocxTailorUserPrompt(
    sections,
    draft,
    jobDescription,
    jobContext,
    options,
  );
  return {
    systemPrompt: STUDIO_DOCX_TAILOR_SYSTEM_PROMPT,
    userPrompt,
    combinedPrompt: buildCombinedPrompt(
      STUDIO_DOCX_TAILOR_SYSTEM_PROMPT,
      userPrompt,
    ),
  };
}

export interface ShrinkFragment {
  id: string;
  text: string;
  budget: number;
  currentLength?: number;
  role?: "summary" | "bullet" | "headline" | "other";
}

export interface ShrinkContext {
  mustHaves?: string[];
  keywords?: { term: string }[];
}

export function buildShrinkUserPrompt(
  fragments: ShrinkFragment[],
  context?: ShrinkContext,
): string {
  const payload: Record<string, unknown> = {
    fragments,
  };
  if (context?.mustHaves && context.mustHaves.length > 0) {
    payload.mustHaves = context.mustHaves;
  }
  if (context?.keywords && context.keywords.length > 0) {
    payload.keywords = context.keywords.map((k) => k.term);
  }
  return `FRAGMENTS TO SHORTEN:\n${JSON.stringify(payload, null, 2)}\n\nReturn only the JSON object.`;
}

export function buildShrinkPromptPackage(
  fragments: ShrinkFragment[],
  context?: ShrinkContext,
): AiPromptPackage {
  const userPrompt = buildShrinkUserPrompt(fragments, context);
  return {
    systemPrompt: SHRINK_SYSTEM_PROMPT,
    userPrompt,
    combinedPrompt: buildCombinedPrompt(SHRINK_SYSTEM_PROMPT, userPrompt),
  };
}
