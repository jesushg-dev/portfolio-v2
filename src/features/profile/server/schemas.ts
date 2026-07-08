import { z } from "zod";

import { LocalizedTextSchema } from "@/lib/i18n/localized";

export const HeroTitleTranslationSchema = z.object({
  appLanguageId: z.string().min(1),
  text: z.string(),
});

export const HeroTitlesUpsertSchema = z.object({
  titles: z.array(
    z.object({
      order: z.number().int().nonnegative(),
      translations: z.array(HeroTitleTranslationSchema).min(1),
    }),
  ),
});

export const PortfolioHeaderUpsertSchema = z.object({
  fullName: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
  backgroundImageUrl: z.string().url().nullable().optional(),
  heroSummary: LocalizedTextSchema.nullable().optional(),
  clientImageAlt: LocalizedTextSchema.nullable().optional(),
});
