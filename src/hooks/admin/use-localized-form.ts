"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type FieldValues,
  type Path,
  type UseFormReturn,
  useWatch,
} from "react-hook-form";

import {
  type LanguageRef,
  type TranslationCompleteness,
  type TranslationMap,
  buildStatusByLangIdFromMap,
  resolvePrimaryLanguage,
} from "@/lib/i18n/localized-form";

export type { LanguageRef, TranslationCompleteness, TranslationMap };

export interface UseLocalizedFormOptions<TFormValues extends FieldValues> {
  languages: LanguageRef[];
  form: UseFormReturn<TFormValues>;
  buildDefaultValues: () => TFormValues;
  /** Pass `initialData?.id` so the form resets when navigating between edit routes. */
  resourceId?: string;
  primaryLanguageCode?: string;
  translationsField?: keyof TFormValues & string;
  /** Translation row keys used for GlobalLanguageSelector completeness dots. */
  completenessFields?: string[];
  /** Translation row keys copied by `copyFieldsFromPrimary`. */
  copyFields?: string[];
}

export function useLocalizedForm<
  TFormValues extends FieldValues,
  _TTranslation extends Record<string, string> = TFormValues extends {
    translations: TranslationMap<infer U>;
  }
    ? U extends Record<string, string>
      ? U
      : Record<string, string>
    : Record<string, string>,
>({
  languages,
  form,
  buildDefaultValues,
  resourceId,
  primaryLanguageCode = "en",
  translationsField = "translations",
  completenessFields = [],
  copyFields = [],
}: UseLocalizedFormOptions<TFormValues>) {
  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages, primaryLanguageCode),
    [languages, primaryLanguageCode],
  );

  const resourceKey = resourceId ?? "__new__";
  const defaultActiveLangId = primaryLang?.id ?? languages[0]?.id ?? "";
  const [langSelectionByResource, setLangSelectionByResource] = useState<
    Record<string, string>
  >({});

  const activeLangId =
    langSelectionByResource[resourceKey] ?? defaultActiveLangId;

  const setActiveLangId = useCallback(
    (langId: string) => {
      setLangSelectionByResource((prev) => ({
        ...prev,
        [resourceKey]: langId,
      }));
    },
    [resourceKey],
  );

  const watchedTranslations = useWatch({
    control: form.control,
    name: translationsField as Path<TFormValues>,
  }) as TranslationMap<_TTranslation> | undefined;

  useEffect(() => {
    form.reset(buildDefaultValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const activeLang = languages.find((language) => language.id === activeLangId);

  const statusByLangId = useMemo(
    () =>
      completenessFields.length > 0
        ? buildStatusByLangIdFromMap(
            languages,
            watchedTranslations,
            completenessFields,
          )
        : undefined,
    [completenessFields, languages, watchedTranslations],
  );

  const copyFieldsFromPrimary = useCallback(
    (targetLangId: string) => {
      if (copyFields.length === 0 || !primaryLang) return;

      const primaryEntry = watchedTranslations?.[primaryLang.id];
      if (!primaryEntry) return;

      for (const field of copyFields) {
        const value = primaryEntry[field as keyof _TTranslation];
        if (typeof value !== "string") continue;

        form.setValue(
          `${String(translationsField)}.${targetLangId}.${field}` as Path<TFormValues>,
          value as never,
          { shouldDirty: true },
        );
      }
    },
    [copyFields, form, primaryLang, translationsField, watchedTranslations],
  );

  return {
    primaryLang,
    activeLangId,
    setActiveLangId,
    activeLang,
    statusByLangId,
    copyFieldsFromPrimary,
    isFormLoading: form.formState.isLoading,
  };
}
