import { z } from "zod";

import { CvImportDraftSchema } from "@/features/cv/lib/cv-import-draft";

export const CvTailorResultSchema = z.object({
  draft: CvImportDraftSchema,
  aiScore: z.number().min(0).max(100),
  matchNotes: z.string().optional(),
});

export type CvTailorResult = z.infer<typeof CvTailorResultSchema>;
