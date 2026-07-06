"use client";

import { useState, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { api } from "@/trpc/react";
import {
  FormRoot,
  FormContent,
  FormSection,
  FormItem,
  FormActions,
} from "@/components/shared/form-root";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";

// ---------------------------------------------------------------------------
// App locales as "languages" array for GlobalLanguageSelector
// ---------------------------------------------------------------------------

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};

const APP_LANGUAGES = locales.map((loc) => ({
  id: loc,
  code: loc,
  name: LOCALE_NAMES[loc],
}));

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const LocalizedTextSchema = z.object({
  default: z.string(),
  translations: z.record(z.string(), z.string()).optional(),
});

const formSchema = z.object({
  aboutMe: LocalizedTextSchema,
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractLocalizedText(raw: unknown) {
  if (!raw || typeof raw !== "object") return { default: "" };
  const obj = raw as Record<string, unknown>;
  return {
    default: typeof obj.default === "string" ? obj.default : "",
    translations:
      typeof obj.translations === "object" && obj.translations !== null
        ? (obj.translations as Record<string, string>)
        : undefined,
  };
}

function getLocaleValue(
  field: { default: string; translations?: Record<string, string> },
  activeLang: Locale,
  defaultLocale: Locale,
): string {
  if (activeLang === defaultLocale) return field.default;
  return field.translations?.[activeLang] ?? "";
}

function setLocaleValue(
  field: { default: string; translations?: Record<string, string> },
  activeLang: Locale,
  defaultLocale: Locale,
  text: string,
): { default: string; translations?: Record<string, string> } {
  if (activeLang === defaultLocale) {
    return { ...field, default: text };
  }
  return {
    ...field,
    translations: { ...field.translations, [activeLang]: text },
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AboutMeFormProps {
  locale: Locale;
  initial?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AboutMeForm({ locale, initial }: AboutMeFormProps) {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aboutMe: extractLocalizedText(initial),
    },
  });

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Locale>(locale);

  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();

  // Preserve consoleCode so we don't overwrite it on save
  const existingConsoleCode =
    initial?.consoleCode !== undefined ? initial.consoleCode : undefined;

  const handleSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          const payload = {
            default: values.aboutMe.default,
            translations: values.aboutMe.translations,
            ...(existingConsoleCode !== undefined
              ? { consoleCode: existingConsoleCode }
              : {}),
          };

          await upsertAboutMe.mutateAsync({ aboutMe: payload });
          await utils.cv.getMine.invalidate();
          toast.success(t("savedSuccess") || "Saved");
        } catch (err) {
          setServerError(err instanceof Error ? err.message : "Save failed");
        }
      });
    },
    [existingConsoleCode, upsertAboutMe, utils, t],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <GlobalLanguageSelector
          languages={APP_LANGUAGES}
          activeLangId={activeLang}
          onLangChange={(id) => setActiveLang(id as Locale)}
        />

        <FormContent error={serverError}>
          <FormSection title={t("aboutMeTitle")}>
            <FormField
              control={form.control}
              name="aboutMe"
              render={({ field }) => (
                <FormItem
                  label={`${t("descriptionLabel")} (${LOCALE_NAMES[activeLang]})`}
                >
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Write a short summary about yourself..."
                      value={getLocaleValue(field.value, activeLang, locale)}
                      onChange={(e) =>
                        field.onChange(
                          setLocaleValue(
                            field.value,
                            activeLang,
                            locale,
                            e.target.value,
                          ),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending}
          title={isPending ? t("saving") : t("save")}
        />
      </FormRoot>
    </Form>
  );
}
