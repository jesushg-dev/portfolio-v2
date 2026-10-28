import { z } from "zod";

const dimensionSchema = z
  .object({
    score: z.number().int().min(0).max(20),
    evidence: z.string().trim().min(1),
  })
  .strict();

const scoreBreakdownObjectSchema = z
  .object({
    technologies: dimensionSchema,
    experience: dimensionSchema,
    operations: dimensionSchema,
    collaboration: dimensionSchema,
    prerequisites: dimensionSchema,
  })
  .strict();

const dimensionPrefixes = {
  technologies: "required technologies",
  experience: "relevant delivery",
  operations: "operations and quality",
  collaboration: "domain and collaboration",
  prerequisites: "explicit prerequisites including language",
} as const;

export const CvScoreBreakdownSchema = z.preprocess((input: unknown) => {
  if (!Array.isArray(input)) return input;
  const rawArray: readonly unknown[] = input;
  const parsed = z.array(dimensionSchema).length(5).safeParse(rawArray);
  if (!parsed.success) return rawArray;
  const entries = Object.entries(dimensionPrefixes).map(([key, prefix]) => {
    const matches = parsed.data.filter((dimension) =>
      dimension.evidence.trim().toLowerCase().startsWith(`${prefix}:`),
    );
    return matches.length === 1 ? ([key, matches[0]] as const) : null;
  });
  // Accept only explicitly identified dimensions; never infer categories by position.
  if (entries.some((entry) => entry === null)) return rawArray;
  return Object.fromEntries(
    entries.filter(
      (entry): entry is readonly [string, z.infer<typeof dimensionSchema>] =>
        entry !== null,
    ),
  );
}, scoreBreakdownObjectSchema);

export const CvMatchKeywordSchema = z.object({
  term: z.string().min(1),
  status: z
    .enum(["present", "paraphrased", "adjacent", "missing"])
    .default("present"),
});

export const CvMatchAnalysisSchema = z.object({
  scoreBreakdown: CvScoreBreakdownSchema.optional(),
  strengths: z.array(z.string().trim().min(1)).optional(),
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
