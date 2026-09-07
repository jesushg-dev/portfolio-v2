import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";
import { buildInterviewPrepSystemPrompt } from "@/features/resume-engine/lib/ai/interview-prep-prompt";
import type { InterviewPrepEventType } from "@/features/resume-engine/lib/interview-prep-result";
import {
  buildCombinedPrompt,
  type AiPromptPackage,
} from "@/features/resume-engine/lib/ai/prompt-package";

export interface InterviewPrepPromptMeta {
  position: string;
  companyName: string;
  eventType: InterviewPrepEventType;
  eventTitle: string;
  eventNotes?: string | null;
  existingQuestions?: string[];
  focusTools?: string[];
}

export function buildInterviewPrepUserPrompt(
  draft: CvImportDraft,
  jobDescription: string,
  matchAnalysis: CvMatchAnalysis | null,
  meta: InterviewPrepPromptMeta,
): string {
  const existing =
    meta.existingQuestions && meta.existingQuestions.length > 0
      ? `\nEXISTING QUESTIONS (do not repeat):\n${meta.existingQuestions
          .map((q) => `- ${q}`)
          .join("\n")}\n`
      : "";

  const notes = meta.eventNotes?.trim()
    ? `\nEVENT NOTES:\n${meta.eventNotes.trim()}\n`
    : "";

  const tools =
    meta.focusTools && meta.focusTools.length > 0
      ? `\nFOCUS TOOLS / DEEP DIVE TECHNOLOGIES:\n${meta.focusTools
          .map((t) => `- ${t}`)
          .join("\n")}\n`
      : "";

  return `ROLE: ${meta.position}
COMPANY: ${meta.companyName}
EVENT TYPE: ${meta.eventType}
EVENT TITLE: ${meta.eventTitle}
${notes}${tools}${existing}
STRUCTURED RESUME:
${JSON.stringify(draft, null, 2)}

MATCH ANALYSIS (optional; treat missing keywords and skillGaps as gaps, not achievements):
${JSON.stringify(matchAnalysis ?? {}, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Write the pack in the same language as the job description.
Unless this is an append, put the "hire" question first in the JSON array.

Return only the JSON object.`;
}

export function buildInterviewPrepPromptPackage(
  draft: CvImportDraft,
  jobDescription: string,
  matchAnalysis: CvMatchAnalysis | null,
  meta: InterviewPrepPromptMeta,
): AiPromptPackage {
  const append = Boolean(meta.existingQuestions?.length);
  const systemPrompt = buildInterviewPrepSystemPrompt(
    meta.eventType,
    append,
    meta.focusTools ?? [],
  );
  const userPrompt = buildInterviewPrepUserPrompt(
    draft,
    jobDescription,
    matchAnalysis,
    meta,
  );
  return {
    systemPrompt,
    userPrompt,
    combinedPrompt: buildCombinedPrompt(systemPrompt, userPrompt),
  };
}
