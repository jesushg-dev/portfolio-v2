import { z } from "zod";
import { isAbsoluteOrLocalImagePath } from "@/utils/tools/image";
import { statusScheduleSchema } from "./status-schedule";
export const nowSettingsSchema = z.object({
  timezone: z
    .string()
    .min(1)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid IANA time zone"),
  githubUsername: z
    .string()
    .trim()
    .regex(/^$|^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i),
  statusEmoji: z.string().trim().min(1).max(16),
  statusSchedule: statusScheduleSchema,
  readingCoverUrl: z
    .string()
    .trim()
    .refine((value) => !value || isAbsoluteOrLocalImagePath(value)),
  watchedCoverUrl: z
    .string()
    .trim()
    .refine((value) => !value || isAbsoluteOrLocalImagePath(value)),
  readingTitle: z.string(),
  readingAuthors: z.string(),
  readingProgress: z.number().int().min(0).max(100),
  watchedTitle: z.string(),
  watchedRating: z.number().int().min(0).max(5),
  photoUrls: z
    .array(z.string().trim().min(1).refine(isAbsoluteOrLocalImagePath))
    .max(6),
  translations: z.record(
    z.string(),
    z.object({
      statusBody: z.string(),
      statusRelative: z.string(),
    }),
  ),
});
export type NowSettingsFormValues = z.infer<typeof nowSettingsSchema>;

export const nowTabSchema = z.discriminatedUnion("tab", [
  nowSettingsSchema
    .pick({
      timezone: true,
      statusEmoji: true,
      translations: true,
      statusSchedule: true,
    })
    .extend({ tab: z.literal("snapshot") }),
  nowSettingsSchema
    .pick({
      readingTitle: true,
      readingAuthors: true,
      readingProgress: true,
      readingCoverUrl: true,
      watchedTitle: true,
      watchedRating: true,
      watchedCoverUrl: true,
      photoUrls: true,
    })
    .extend({ tab: z.literal("activity") }),
  nowSettingsSchema
    .pick({ githubUsername: true })
    .extend({ tab: z.literal("github") }),
]);
export type NowTabInput = z.infer<typeof nowTabSchema>;
