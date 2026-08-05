import { z } from "zod";

/**
 * Response shape for the repair ("shrink") pass — just the runs that were
 * over budget, each with its shortened replacement text.
 */
export const ShrinkResultSchema = z.object({
  runs: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
    }),
  ),
});

export type ShrinkResult = z.infer<typeof ShrinkResultSchema>;
