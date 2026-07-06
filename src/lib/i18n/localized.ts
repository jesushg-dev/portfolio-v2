import { z } from "zod";

import { locales, type Locale } from "@/i18n/config";

/**
 * Translations are stored as a partial map keyed by locale, e.g.
 * `{ en: "Hello", es: "Hola" }`. We use a plain `z.object` with optional
 * fields (rather than `z.record`) so the inferred type allows any subset
 * of locales to be present.
 */
const TranslationsSchema = z
  .object({
    en: z.string().optional(),
    es: z.string().optional(),
    nl: z.string().optional(),
  })
  .optional();

export const LocalizedTextSchema = z
  .object({
    default: z.string().min(1, "Default text is required"),
    translations: TranslationsSchema,
  })
  .passthrough();

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

/**
 * Reads a `LocalizedText` value (stored as JSON in DB) and resolves the
 * appropriate string for the requested locale. Falls back to the default
 * locale (the user's primary language) when no translation is available.
 *
 * Accepts `unknown` to gracefully handle DB rows where the JSON shape is
 * not yet validated.
 */
export const getLocalizedText = (
  value: unknown,
  locale: Locale,
  defaultLocale?: Locale,
): string => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const candidate = value as {
    default?: string;
    translations?: Record<string, string | undefined>;
  };

  const translation = candidate.translations?.[locale];
  if (translation?.trim()) return translation;

  if (defaultLocale && defaultLocale !== locale) {
    const fallback = candidate.translations?.[defaultLocale];
    if (fallback?.trim()) return fallback;
  }

  return candidate.default ?? "";
};

/**
 * Convenience helper to build a LocalizedText from a triple
 * (en, es, nl). The defaultLocale determines which one becomes the
 * `default` field; the rest are stored in `translations`.
 */
export const buildLocalizedText = (
  values: Partial<Record<Locale, string>>,
  defaultLocale: Locale,
): LocalizedText => {
  const defaultText = values[defaultLocale];
  if (!defaultText) {
    throw new Error(`Default locale "${defaultLocale}" is missing in values`);
  }

  const translations: Partial<Record<Locale, string>> = {};
  for (const loc of locales) {
    if (loc !== defaultLocale && values[loc]) {
      translations[loc] = values[loc];
    }
  }

  return {
    default: defaultText,
    translations:
      Object.keys(translations).length > 0 ? translations : undefined,
  };
};
