import { z } from "zod";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TextTranslationMap,
  type TranslationMap,
  translationMapEntries,
} from "@/lib/i18n/translation-map";

export type { LanguageRef };
export type { TextTranslationMap, TranslationMap };

export type TranslationCompleteness = "empty" | "partial" | "complete";

export function resolvePrimaryLanguage(
  languages: LanguageRef[],
  primaryLanguageCode = "en",
): LanguageRef | undefined {
  return (
    languages.find((language) => language.code === primaryLanguageCode) ??
    languages[0]
  );
}

export function getTranslationCompleteness<T extends Record<string, unknown>>(
  entry: T,
  fields: string[],
): TranslationCompleteness {
  const filled = fields.filter((field) => {
    const value = entry[field];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (filled.length === 0) return "empty";
  if (filled.length === fields.length) return "complete";
  return "partial";
}

export function buildStatusByLangIdFromMap<T extends Record<string, string>>(
  languages: LanguageRef[],
  translations: TranslationMap<T> | undefined,
  fields: string[],
): Record<string, TranslationCompleteness> {
  return Object.fromEntries(
    languages.map((language) => {
      const entry = translations?.[language.id];
      if (!entry) return [language.id, "empty" as const];
      return [language.id, getTranslationCompleteness(entry, fields)];
    }),
  );
}

/** Zod superRefine helper: require a non-empty string field on the primary language map entry. */
export function primaryTranslationMapRequired(
  primaryLangId: string | undefined,
  field: string,
  message: string,
) {
  return (
    map: Record<string, Record<string, unknown>>,
    ctx: z.RefinementCtx,
  ) => {
    if (!primaryLangId) return;

    const value = map[primaryLangId]?.[field];
    if (typeof value !== "string" || value.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [primaryLangId, field],
      });
    }
  };
}

export function translationMapSchema<T extends z.ZodRawShape>(
  valueSchema: z.ZodObject<T>,
  primaryLangId: string | undefined,
  primaryField: keyof z.infer<typeof valueSchema> & string,
  message: string,
) {
  return z
    .record(z.string(), valueSchema)
    .superRefine(
      primaryTranslationMapRequired(primaryLangId, primaryField, message),
    );
}

export const titleDescriptionTranslationValueSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export function titleDescriptionTranslationMapSchema(
  primaryLangId: string | undefined,
  message: string,
) {
  return translationMapSchema(
    titleDescriptionTranslationValueSchema,
    primaryLangId,
    "title",
    message,
  );
}

export const textTranslationValueSchema = z.object({
  text: z.string(),
});

export function textTranslationMapSchema(
  primaryLangId: string | undefined,
  message: string,
) {
  return translationMapSchema(
    textTranslationValueSchema,
    primaryLangId,
    "text",
    message,
  );
}

export const TextTranslationMapSchema = z.record(
  z.string(),
  textTranslationValueSchema,
);

export function translationEntriesFromMap<T extends Record<string, string>>(
  map: TranslationMap<T>,
) {
  return translationMapEntries(map);
}
