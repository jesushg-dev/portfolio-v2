import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { CvImportTextSection } from "@/features/cv/lib/cv-import-draft";
import type { CvSection } from "@/lib/types";
import { isDocxTitleStyle } from "@/lib/docx/parser";
import { skillAlignedBudget } from "@/features/resume-engine/lib/ai/skill-chip-budget";
import { IMPORT_SYSTEM_PROMPT } from "@/features/resume-engine/lib/ai/import-prompt";
import {
  DOCX_TAILOR_SYSTEM_PROMPT,
  STUDIO_DOCX_TAILOR_SYSTEM_PROMPT,
  SHRINK_SYSTEM_PROMPT,
} from "@/features/resume-engine/lib/ai/docx-tailor-prompt";
import { TAILOR_SYSTEM_PROMPT } from "@/features/resume-engine/lib/ai/tailor-prompt";
import {
  formatTailorJobContext,
  type TailorJobContext,
} from "@/features/resume-engine/lib/ai/tailor-job-context";

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

export function buildTailorUserPrompt(
  draft: CvImportDraft,
  jobDescription: string,
  jobContext?: TailorJobContext | null,
): string {
  return appendJobContext(
    `STRUCTURED RESUME:\n${JSON.stringify(draft, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nReturn only the JSON object.`,
    jobContext,
  );
}

export function buildTailorPromptPackage(
  draft: CvImportDraft,
  jobDescription: string,
  jobContext?: TailorJobContext | null,
): AiPromptPackage {
  const userPrompt = buildTailorUserPrompt(draft, jobDescription, jobContext);
  return {
    systemPrompt: TAILOR_SYSTEM_PROMPT,
    userPrompt,
    combinedPrompt: buildCombinedPrompt(TAILOR_SYSTEM_PROMPT, userPrompt),
  };
}

/**
 * Stamps each run with a "budget" equal to its original character count so
 * the model gets a concrete limit instead of a vague "be concise".
 * Title / job-role headline paragraphs are exempt — no budget field.
 */
function withBudgets(sections: CvSection[]) {
  return sections.map((section) => ({
    ...section,
    paragraphs: section.paragraphs.map((paragraph) => {
      const skipBudget = isDocxTitleStyle(paragraph.style);
      return {
        ...paragraph,
        runs: paragraph.runs.map((run) =>
          skipBudget
            ? { ...run }
            : { ...run, budget: skillAlignedBudget(run.text) },
        ),
      };
    }),
  }));
}

export function buildDocxTailorUserPrompt(
  sections: CvSection[],
  jobDescription: string,
  jobContext?: TailorJobContext | null,
): string {
  return appendJobContext(
    `ADAPTABLE SECTIONS:\n${JSON.stringify(withBudgets(sections), null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nReturn only the JSON object.`,
    jobContext,
  );
}

export function buildDocxTailorPromptPackage(
  sections: CvSection[],
  jobDescription: string,
  jobContext?: TailorJobContext | null,
): AiPromptPackage {
  const userPrompt = buildDocxTailorUserPrompt(
    sections,
    jobDescription,
    jobContext,
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
): string {
  return appendJobContext(
    `DOCX TEMPLATE SECTIONS (preserve ids, paragraph ids, run ids, and run counts — only change text; "budget" is each run's max character length when present — title/headline runs have no budget):
${JSON.stringify(withBudgets(sections), null, 2)}

STRUCTURED RESUME DATA (factual source from CMS — map into template paragraphs):
${JSON.stringify(draft, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Return only the JSON object.`,
    jobContext,
  );
}

export function buildStudioDocxTailorPromptPackage(
  sections: CvSection[],
  draft: CvImportDraft,
  jobDescription: string,
  jobContext?: TailorJobContext | null,
): AiPromptPackage {
  const userPrompt = buildStudioDocxTailorUserPrompt(
    sections,
    draft,
    jobDescription,
    jobContext,
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
}

export function buildShrinkUserPrompt(fragments: ShrinkFragment[]): string {
  return `FRAGMENTS TO SHORTEN:\n${JSON.stringify(fragments, null, 2)}\n\nReturn only the JSON object.`;
}

export function buildShrinkPromptPackage(
  fragments: ShrinkFragment[],
): AiPromptPackage {
  const userPrompt = buildShrinkUserPrompt(fragments);
  return {
    systemPrompt: SHRINK_SYSTEM_PROMPT,
    userPrompt,
    combinedPrompt: buildCombinedPrompt(SHRINK_SYSTEM_PROMPT, userPrompt),
  };
}
