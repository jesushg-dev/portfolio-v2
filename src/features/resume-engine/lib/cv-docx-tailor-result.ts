import { z } from "zod";

import { CvMatchAnalysisSchema } from "@/features/resume-engine/lib/cv-match-analysis";
import type { CvSection, AdaptedSection } from "@/lib/types";

export const CvDocxTailorEditSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export type CvDocxTailorEdit = z.infer<typeof CvDocxTailorEditSchema>;

/**
 * Validates the direct JSON response from the LLM.
 * The LLM only returns the edits array (run id -> tailored text).
 */
export const CvDocxTailorResultSchema = z.object({
  detectedLocale: z.enum(["en", "es", "nl"]),
  aiScore: z.number().min(0).max(100),
  matchNotes: z.string().optional(),
  matchAnalysis: CvMatchAnalysisSchema.optional(),
  sourceWarnings: z.array(z.string()).default([]),
  edits: z.array(CvDocxTailorEditSchema).default([]),
});

export type CvDocxTailorResult = z.infer<typeof CvDocxTailorResultSchema>;

/**
 * Result returned by tailorDocxResume, combining the LLM metadata,
 * validated edits, and synthesized adapted sections.
 */
export interface TailoredResumeResult extends CvDocxTailorResult {
  sections: AdaptedSection[];
}

/**
 * Applies a list of run edits onto the original document sections.
 */
export function applyEditsToSections(
  edits: CvDocxTailorEdit[],
  originalSections: CvSection[],
): AdaptedSection[] {
  const editsMap = new Map<string, string>();
  for (const edit of edits) {
    editsMap.set(edit.id, edit.text);
  }

  return originalSections.map((sec) => ({
    id: sec.id,
    paragraphs: sec.paragraphs.map((p) => ({
      id: p.id,
      runs: p.runs.map((r) => ({
        id: r.id,
        text: editsMap.get(r.id) ?? r.text,
      })),
    })),
  }));
}
