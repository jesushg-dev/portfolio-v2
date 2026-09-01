import { z } from "zod";

export const CvMatchKeywordSchema = z.object({
  term: z.string().min(1),
  status: z.enum(["present", "paraphrased", "missing"]).default("present"),
});

export const CvMatchAnalysisSchema = z.object({
  keywords: z.array(CvMatchKeywordSchema).default([]),
  mustHaves: z.array(z.string().min(1)).default([]),
  niceToHaves: z.array(z.string().min(1)).default([]),
  skillGaps: z.array(z.string().min(1)).default([]),
  improvements: z.array(z.string().min(1)).default([]),
  touchedBlocks: z.array(z.string().min(1)).default([]),
  notes: z.string().optional(),
});

export type CvMatchKeyword = z.infer<typeof CvMatchKeywordSchema>;
export type CvMatchAnalysis = z.infer<typeof CvMatchAnalysisSchema>;

export function parseMatchAnalysis(value: unknown): CvMatchAnalysis | null {
  const parsed = CvMatchAnalysisSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
