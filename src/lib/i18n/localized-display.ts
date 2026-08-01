import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  type TranslationMap,
  translationMapEntries,
} from "@/lib/i18n/translation-map";

export type { LanguageRef };

/** Meta / FK keys that are never localized text fields. */
type TranslationMetaKey = "id" | "appLanguageId";

/**
 * String-valued keys on a translation row, excluding ids and foreign keys.
 * Example: `{ appLanguageId; name; cvSoftSkillId }` → `"name"`.
 */
export type LocalizedStringFieldKeys<TRow> = {
  [K in keyof TRow]-?: NonNullable<TRow[K]> extends string
    ? K extends TranslationMetaKey
      ? never
      : K extends `${string}Id`
        ? never
        : K & string
    : never;
}[keyof TRow];

/**
 * Infer allowed field names from translation rows or a TranslationMap.
 * `T | undefined | null` still resolves keys from the non-null shape.
 */
export type LocalizedFieldKeys<T> = [T] extends [null | undefined]
  ? never
  : NonNullable<T> extends readonly (infer Row)[]
    ? LocalizedStringFieldKeys<Row>
    : // TranslationMap / Record<langId, fields> — pick keys from the value type
      LocalizedStringFieldKeys<NonNullable<T>[keyof NonNullable<T>]>;

interface AnyTranslationRow {
  appLanguageId: string;
  [field: string]: unknown;
}

function toTranslationRows(
  translations: unknown,
): ({ appLanguageId: string } & Record<string, unknown>)[] {
  if (!translations) return [];
  const raw = Array.isArray(translations)
    ? (translations as AnyTranslationRow[])
    : translationMapEntries(
        translations as TranslationMap<Record<string, string>>,
      );
  return raw;
}

export function getRowTextForLocale(
  rows:
    | { appLanguageId: string; text: string }[]
    | TranslationMap<{ text: string }>,
  languages: LanguageRef[],
  localeCode: string,
): string {
  const entries = toTranslationRows(
    Array.isArray(rows)
      ? rows
      : Object.fromEntries(
          Object.entries(rows ?? {}).map(([appLanguageId, value]) => [
            appLanguageId,
            value,
          ]),
        ),
  );
  const language =
    languages.find((lang) => lang.code === localeCode) ?? languages[0];
  if (!language) return "";

  const entry = entries.find((row) => row.appLanguageId === language.id);
  const localized = typeof entry?.text === "string" ? entry.text.trim() : "";
  if (localized) return localized;

  const primaryLanguage =
    languages.find((lang) => lang.code === "en") ?? languages[0];
  const primaryEntry = entries.find(
    (row) => row.appLanguageId === primaryLanguage?.id,
  );
  const primaryText =
    typeof primaryEntry?.text === "string" ? primaryEntry.text.trim() : "";
  if (primaryText) return primaryText;

  const firstNonEmpty = entries.find(
    (row) => typeof row.text === "string" && row.text.trim(),
  );
  return typeof firstNonEmpty?.text === "string"
    ? firstNonEmpty.text.trim()
    : "";
}

function getLocalizedFieldForLocale<T>(
  translations: T,
  languages: LanguageRef[],
  localeCode: string,
  field: LocalizedFieldKeys<NonNullable<T>>,
): string {
  const entries = toTranslationRows(translations);
  const fieldName = field as string;

  if (languages.length === 0) return "";

  const language =
    languages.find((lang) => lang.code === localeCode) ?? languages[0];
  if (language) {
    const entry = entries.find(
      (translation) => translation.appLanguageId === language.id,
    );
    const localized = entry?.[fieldName];
    if (typeof localized === "string" && localized.trim())
      return localized.trim();
  }

  const primaryLanguage =
    languages.find((lang) => lang.code === "en") ?? languages[0];
  if (primaryLanguage) {
    const primaryEntry = entries.find(
      (translation) => translation.appLanguageId === primaryLanguage.id,
    );
    const primaryText = primaryEntry?.[fieldName];
    if (typeof primaryText === "string" && primaryText.trim())
      return primaryText.trim();
  }

  const firstNonEmpty = entries.find((translation) => {
    const value = translation?.[fieldName];
    return typeof value === "string" && value.trim().length > 0;
  });
  return typeof firstNonEmpty?.[fieldName] === "string"
    ? firstNonEmpty[fieldName].trim()
    : "";
}

export function getTitleDescriptionForLocale<T>(
  translations: T,
  languages: LanguageRef[],
  localeCode: string,
  field: Extract<LocalizedFieldKeys<NonNullable<T>>, "title" | "description">,
): string {
  return getLocalizedFieldForLocale(translations, languages, localeCode, field);
}

/**
 * Bound field resolver: `t("location")` after fixing languages + locale +
 * translations. Prefer this over repeating getLocalizedFieldForLocale args.
 */
export type LocalizedFieldFn<TFields extends string = string> = (
  field: TFields,
) => string;

export interface LocalizedFieldResolver {
  /** Resolve a field; `field` is constrained to keys on the translation shape. */
  <T>(translations: T, field: LocalizedFieldKeys<NonNullable<T>>): string;
  /** Bind translations once → flat `t("field")` with typed keys. */
  for: <T>(
    translations: T,
  ) => LocalizedFieldFn<LocalizedFieldKeys<NonNullable<T>>>;
}

/**
 * Creates a locale-bound resolver so callers avoid passing `languages` +
 * `localeCode` on every call. Usage:
 *
 * ```ts
 * const field = createLocalizedFieldResolver(appLanguages, locale);
 * field(exp.translations, "role");
 * const t = field.for(exp.translations);
 * t("location"); // only valid keys autocomplete
 * ```
 */
export function createLocalizedFieldResolver(
  languages: LanguageRef[],
  localeCode: string,
): LocalizedFieldResolver {
  const resolve = (<T>(
    translations: T,
    field: LocalizedFieldKeys<NonNullable<T>>,
  ) =>
    getLocalizedFieldForLocale(
      translations,
      languages,
      localeCode,
      field,
    )) as LocalizedFieldResolver;

  resolve.for = <T>(
    translations: T,
  ): LocalizedFieldFn<LocalizedFieldKeys<NonNullable<T>>> => {
    return (field) => resolve(translations, field);
  };

  return resolve;
}
