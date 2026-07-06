"use client";

import { useState, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
  fullName: z.string().min(1),
  photoUrl: z.string().url().or(z.literal("")),
  degree: LocalizedTextSchema,
  clientImageAlt: LocalizedTextSchema,
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the value for the active locale from a LocalizedText field */
function getLocaleValue(
  field: { default: string; translations?: Record<string, string> },
  activeLang: Locale,
  defaultLocale: Locale,
): string {
  if (activeLang === defaultLocale) return field.default;
  return field.translations?.[activeLang] ?? "";
}

/** Return a new LocalizedText after setting the value for the active locale */
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

interface HeroFormProps {
  locale: Locale;
  initial?: FormValues;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeroForm({ locale, initial }: HeroFormProps) {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial ?? {
      fullName: "",
      photoUrl: "",
      degree: { default: "" },
      clientImageAlt: { default: "" },
    },
  });

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Locale>(locale);

  const upsertHeader = api.cv.upsertHeader.useMutation();

  const photoUrlValue = form.watch("photoUrl");
  const fullNameValue = form.watch("fullName");

  const handleSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          await upsertHeader.mutateAsync({
            fullName: values.fullName,
            degree: values.degree,
            photoUrl: values.photoUrl || null,
            clientImageAlt: values.clientImageAlt,
          });

          await utils.cv.getMine.invalidate();
          toast.success(t("savedSuccess") || "Saved");
        } catch (err) {
          setServerError(err instanceof Error ? err.message : "Save failed");
        }
      });
    },
    [upsertHeader, utils, t],
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
          {/* ── Hero section: name + photo ── */}
          <FormSection title={t("heroSection")}>
            <div className="flex items-start gap-6">
              <div className="mt-2 shrink-0">
                {photoUrlValue ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrlValue}
                    alt={fullNameValue}
                    className="border-background h-24 w-24 rounded-full border-4 object-cover shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                    }}
                  />
                ) : (
                  <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed">
                    <User className="text-muted-foreground/70 h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem label={t("fullNameLabel")}>
                      <FormControl>
                        <Input {...field} placeholder="Jesús Hernández" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem label={t("photoUrlLabel")}>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.com/photo.jpg"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {/* ── Professional title (degree) — per-locale ── */}
          <FormSection title={t("professionalTitle")}>
            <FormField
              control={form.control}
              name="degree"
              render={({ field }) => (
                <FormItem
                  label={`${t("degreeLabel")} (${LOCALE_NAMES[activeLang]})`}
                >
                  <FormControl>
                    <Input
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
                      placeholder="e.g. Web Developer"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormSection>

          {/* ── Image alt text — per-locale ── */}
          <FormSection title={t("altTextTitle") || "Alt Text"}>
            <p className="text-muted-foreground mb-4 text-xs">
              {t("altTextHint")}
            </p>
            <FormField
              control={form.control}
              name="clientImageAlt"
              render={({ field }) => (
                <FormItem
                  label={`${t("altTextLabel") || "Image Alt Text"} (${LOCALE_NAMES[activeLang]})`}
                >
                  <FormControl>
                    <Textarea
                      rows={2}
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
                      placeholder="e.g. Photo of Jesús sitting at a desk"
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
