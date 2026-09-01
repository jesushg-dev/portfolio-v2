import { z } from "zod";

import { CvMatchAnalysisSchema } from "@/features/resume-engine/lib/cv-match-analysis";

const AdaptedRunSchema = z.object({
  id: z.string(),
  text: z.string(),
});

const AdaptedParagraphSchema = z.object({
  id: z.string(),
  runs: z.array(AdaptedRunSchema),
});

const AdaptedSectionSchema = z.object({
  id: z.string(),
  paragraphs: z.array(AdaptedParagraphSchema),
});

export const CvDocxTailorResultSchema = z.object({
  detectedLocale: z.enum(["en", "es", "nl"]),
  sections: z.array(AdaptedSectionSchema),
  aiScore: z.number().min(0).max(100),
  matchNotes: z.string().optional(),
  matchAnalysis: CvMatchAnalysisSchema.optional(),
});

export type CvDocxTailorResult = z.infer<typeof CvDocxTailorResultSchema>;
