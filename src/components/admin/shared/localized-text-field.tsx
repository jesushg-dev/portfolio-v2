"use client";

import { useState, type ChangeEvent } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { useTranslations } from "next-intl";

import { type Locale } from "@/i18n/config";
import type { LocalizedText } from "@/lib/i18n/localized";

import { useCvEditorLocale } from "./cv-editor-locale-context";
import LocaleSegment from "./locale-segment";

interface ILocalizedTextFieldProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  defaultLocale: Locale;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
  description?: string;
}

export function LocalizedTextField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  defaultLocale,
  multiline = false,
  required,
  placeholder,
  description,
}: ILocalizedTextFieldProps<TFieldValues>) {
  const t = useTranslations("admin.forms.localized");
  const editorLocale = useCvEditorLocale();
  const [localLocale, setLocalLocale] = useState<Locale>(defaultLocale);
  const activeLocale = editorLocale?.editLocale ?? localLocale;
  const showFieldTabs = !editorLocale;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = (field.value ?? {
          default: "",
          translations: {},
        }) as Partial<LocalizedText> & {
          translations?: Partial<Record<Locale, string>>;
        };

        const setLocaleValue = (loc: Locale, text: string) => {
          if (loc === defaultLocale) {
            field.onChange({ ...value, default: text });
          } else {
            field.onChange({
              ...value,
              translations: { ...(value.translations ?? {}), [loc]: text },
            });
          }
        };

        const getLocaleValue = (loc: Locale): string => {
          if (loc === defaultLocale) return value.default ?? "";
          return value.translations?.[loc] ?? "";
        };

        const Element = multiline ? "textarea" : "input";
        const isDefaultLocale = activeLocale === defaultLocale;

        return (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-foreground text-sm font-medium">
                {label}
                {required ? (
                  <span className="text-destructive ml-0.5">*</span>
                ) : null}
              </label>
              {showFieldTabs ? (
                <LocaleSegment
                  value={activeLocale}
                  onChange={setLocalLocale}
                  defaultLocale={defaultLocale}
                  size="sm"
                />
              ) : (
                <span className="text-muted-foreground text-xs">
                  {activeLocale.toUpperCase()}
                  {isDefaultLocale ? " · default" : ""}
                </span>
              )}
            </div>
            {description ? (
              <p className="text-muted-foreground text-xs">{description}</p>
            ) : null}

            <Element
              value={getLocaleValue(activeLocale)}
              onChange={(
                e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
              ) => setLocaleValue(activeLocale, e.target.value)}
              onBlur={field.onBlur}
              placeholder={
                placeholder ??
                (isDefaultLocale
                  ? t("requiredDefault")
                  : t("optionalTranslation"))
              }
              rows={multiline ? 5 : undefined}
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-3"
            />

            {fieldState.error ? (
              <p className="text-destructive text-xs">
                {fieldState.error.message ?? t("defaultRequired")}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}

export default LocalizedTextField;
