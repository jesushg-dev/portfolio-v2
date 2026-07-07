import { z } from "zod";

export const TerminalUpsertSchema = z.object({
  username: z.string().min(1),
  typingSpeed: z.number().int().positive().optional(),
  delayBetweenCommands: z.number().int().nonnegative().optional(),
  steps: z
    .array(
      z.object({
        order: z.number().int().nonnegative(),
        translations: z
          .array(
            z.object({
              appLanguageId: z.string().min(1),
              command: z.string().min(1),
              output: z.string(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});
