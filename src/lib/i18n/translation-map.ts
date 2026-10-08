import type { LanguageRef } from "@/lib/i18n/editor-rows";

export type TranslationMap<T extends object> = Record<string, T>;

export interface TextTranslationFields {
  text: string;
}

export type TextTranslationMap = TranslationMap<TextTranslationFields>;

export type TranslationRow<T extends object> = {
  appLanguageId: string;
} & T;

export function buildEmptyTranslationMap<T extends object>(
  languages: LanguageRef[],
  emptyFields: T,
): TranslationMap<T> {
  return Object.fromEntries(
    languages.map((language) => [language.id, { ...emptyFields }]),
  );
}

export function translationRowsToMap<T extends object>(
  rows: TranslationRow<T>[],
): TranslationMap<T> {
  return Object.fromEntries(
    rows.map(({ appLanguageId, ...fields }) => [appLanguageId, fields]),
  ) as unknown as TranslationMap<T>;
}

export function translationMapToRows<T extends object>(
  map: TranslationMap<T>,
  languages: LanguageRef[],
): TranslationRow<T>[] {
  return languages.map((language) => ({
    appLanguageId: language.id,
    ...(map[language.id] ?? ({} as T)),
  }));
}

export function mergeTranslationMap<T extends object>(
  languages: LanguageRef[],
  source: TranslationMap<T> | TranslationRow<T>[] | undefined | null,
  emptyFields: T,
): TranslationMap<T> {
  const map = Array.isArray(source)
    ? translationRowsToMap(source)
    : (source ?? {});

  return Object.fromEntries(
    languages.map((language) => [
      language.id,
      map[language.id] ?? { ...emptyFields },
    ]),
  );
}

export function translationMapEntries<T extends object>(
  map: TranslationMap<T>,
): TranslationRow<T>[] {
  return Object.entries(map).map(([appLanguageId, fields]) => ({
    appLanguageId,
    ...fields,
  }));
}

export function textTranslationMapFromRows<
  TRow extends { appLanguageId: string },
>(
  languages: LanguageRef[],
  rows: TRow[] | undefined,
  pickText: (row: TRow) => string | null | undefined,
): TextTranslationMap {
  return mergeTranslationMap(
    languages,
    rows?.map((row) => ({
      appLanguageId: row.appLanguageId,
      text: pickText(row) ?? "",
    })),
    { text: "" },
  );
}
