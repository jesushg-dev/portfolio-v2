"use client";

import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { useTranslations } from "next-intl";

import { type Locale } from "@/i18n/config";
import type { LocalizedText } from "@/lib/i18n/localized";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

        const isDefaultLocale = activeLocale === defaultLocale;
        const fieldPlaceholder =
          placeholder ??
          (isDefaultLocale ? t("requiredDefault") : t("optionalTranslation"));

        return (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>
                {label}
                {required ? (
                  <span className="text-destructive ml-0.5">*</span>
                ) : null}
              </Label>
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

            {multiline ? (
              <Textarea
                value={getLocaleValue(activeLocale)}
                onChange={(e) => setLocaleValue(activeLocale, e.target.value)}
                onBlur={field.onBlur}
                placeholder={fieldPlaceholder}
                rows={5}
                className="resize-none"
              />
            ) : (
              <Input
                type="text"
                value={getLocaleValue(activeLocale)}
                onChange={(e) => setLocaleValue(activeLocale, e.target.value)}
                onBlur={field.onBlur}
                placeholder={fieldPlaceholder}
              />
            )}

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
