"use client";

import { useState, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/react";
import { LocalizedField } from "@/components/admin/localized-field";
import { TranslationNudgeBanner } from "@/components/admin/translation-nudge-banner";
import { useTranslationNudge } from "@/hooks/admin/use-translation-nudge";
import {
  FormRoot,
  FormContent,
  FormSection,
  FormItem,
  FormActions,
} from "@/components/shared/form-root";
import { Form, FormField, FormControl } from "@/components/ui/form";

const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  es: { label: "Español", flag: "🇪🇸" },
  nl: { label: "Nederlands", flag: "🇳🇱" },
};

const OTHER_LOCALES: Record<Locale, Locale[]> = {
  en: ["es", "nl"],
  es: ["en", "nl"],
  nl: ["en", "es"],
};

const LocalizedTextSchema = z.object({
  default: z.string(),
  translations: z.record(z.string(), z.string()).optional(),
});

const formSchema = z.object({
  aboutMe: LocalizedTextSchema,
});

type FormValues = z.infer<typeof formSchema>;

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

interface AboutMeFormProps {
  locale: Locale;
  initial?: Record<string, unknown> | null;
}

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

  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();
  const aboutNudge = useTranslationNudge(`about_text_${locale}`);

  const handleSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          const payload = {
            default: values.aboutMe.default,
            translations: values.aboutMe.translations,
          };

          await upsertAboutMe.mutateAsync({
            aboutMe: payload,
          });

          await utils.cv.getMine.invalidate();

          const prevAboutDefault = extractLocalizedText(initial).default;
          if (values.aboutMe.default !== prevAboutDefault) {
            const otherLocaleValues = Object.fromEntries(
              OTHER_LOCALES[locale].map((loc) => [
                loc,
                {
                  ...LOCALE_META[loc],
                  value: values.aboutMe.translations?.[loc] ?? "",
                },
              ]),
            );
            aboutNudge.triggerNudge({
              storageKey: `about_text_${locale}`,
              fieldLabel: t("descriptionLabel") || "About Me Description",
              editedLocale: locale,
              editedValue: values.aboutMe.default,
              otherLocaleValues,
            });
          }
        } catch (err) {
          setServerError(err instanceof Error ? err.message : "Save failed");
        }
      });
    },
    [initial, locale, t, aboutNudge, upsertAboutMe, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent error={serverError}>
          <FormSection title={t("aboutMeTitle")}>
            <FormField
              control={form.control}
              name="aboutMe"
              render={({ field }) => (
                <FormItem label={t("descriptionLabel")}>
                  <FormControl>
                    <LocalizedField
                      mode="app-locales"
                      multiline={true}
                      label={t("descriptionLabel")}
                      value={field.value}
                      onChange={field.onChange}
                      defaultLocale={locale}
                      placeholder="Write a short summary about yourself..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {aboutNudge.nudge && (
              <div className="mt-4">
                <TranslationNudgeBanner
                  nudge={aboutNudge.nudge}
                  onSaveLocale={async (loc, value) => {
                    if (!value) {
                      aboutNudge.markSkipped(loc);
                      return;
                    }
                    const updated = {
                      ...form.getValues("aboutMe"),
                      translations: {
                        ...form.getValues("aboutMe").translations,
                        [loc]: value,
                      },
                    };
                    form.setValue("aboutMe", updated, { shouldDirty: true });

                    await upsertAboutMe.mutateAsync({
                      aboutMe: {
                        default: updated.default,
                        translations: updated.translations,
                      },
                    });
                    aboutNudge.markDone(loc);
                  }}
                  onApplyAll={async (value) => {
                    const allTranslations = Object.fromEntries(
                      OTHER_LOCALES[locale].map((loc) => [loc, value]),
                    );
                    const updated = {
                      ...form.getValues("aboutMe"),
                      translations: {
                        ...form.getValues("aboutMe").translations,
                        ...allTranslations,
                      },
                    };
                    form.setValue("aboutMe", updated, { shouldDirty: true });

                    await upsertAboutMe.mutateAsync({
                      aboutMe: {
                        default: updated.default,
                        translations: updated.translations,
                      },
                    });
                    aboutNudge.markAllDone();
                  }}
                  onDismiss={() => aboutNudge.dismiss()}
                />
              </div>
            )}
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
