import { z } from "zod";

import { CvImportDraftSchema } from "@/features/cv/lib/cv-import-draft";
import { CvMatchAnalysisSchema } from "@/features/resume-engine/lib/cv-match-analysis";

export const CvTailorResultSchema = z.object({
  draft: CvImportDraftSchema,
  aiScore: z.number().min(0).max(100),
  matchNotes: z.string().optional(),
  matchAnalysis: CvMatchAnalysisSchema.optional(),
});

export type CvTailorResult = z.infer<typeof CvTailorResultSchema>;
