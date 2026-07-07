"use client";

import { useState, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "lucide-react";

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
import { Input } from "@/components/ui/input";

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
  fullName: z.string().min(1),
  photoUrl: z.string().url().or(z.literal("")),
  degree: LocalizedTextSchema,
  clientImageAlt: LocalizedTextSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface HeroFormProps {
  locale: Locale;
  initial?: FormValues;
}

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

  const upsertHeader = api.cv.upsertHeader.useMutation();
  const degreeNudge = useTranslationNudge(`profile_degree_${locale}`);

  const photoUrlValue = useWatch({ control: form.control, name: "photoUrl" });
  const fullNameValue = useWatch({ control: form.control, name: "fullName" });

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

          const prevDegreeDefault = initial?.degree?.default ?? "";
          if (values.degree.default !== prevDegreeDefault) {
            const otherLocaleValues = Object.fromEntries(
              OTHER_LOCALES[locale].map((loc) => [
                loc,
                {
                  ...LOCALE_META[loc],
                  value: values.degree.translations?.[loc] ?? "",
                },
              ]),
            );
            degreeNudge.triggerNudge({
              storageKey: `profile_degree_${locale}`,
              fieldLabel: t("degreeLabel"),
              editedLocale: locale,
              editedValue: values.degree.default,
              otherLocaleValues,
            });
          }
        } catch (err) {
          setServerError(err instanceof Error ? err.message : "Save failed");
        }
      });
    },
    [initial, locale, t, degreeNudge, upsertHeader, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent error={serverError}>
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

          <FormSection title={t("professionalTitle")}>
            <FormField
              control={form.control}
              name="degree"
              render={({ field }) => (
                <FormItem label={t("degreeLabel")}>
                  <FormControl>
                    <LocalizedField
                      mode="app-locales"
                      label={t("degreeLabel")}
                      value={field.value}
                      onChange={field.onChange}
                      defaultLocale={locale}
                      placeholder="e.g. Web Developer"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {degreeNudge.nudge && (
              <div className="mt-4">
                <TranslationNudgeBanner
                  nudge={degreeNudge.nudge}
                  onSaveLocale={async (loc, value) => {
                    if (!value) {
                      degreeNudge.markSkipped(loc);
                      return;
                    }
                    const updatedDegree = {
                      ...form.getValues("degree"),
                      translations: {
                        ...form.getValues("degree").translations,
                        [loc]: value,
                      },
                    };
                    form.setValue("degree", updatedDegree, {
                      shouldDirty: true,
                    });

                    await upsertHeader.mutateAsync({
                      ...form.getValues(),
                      degree: updatedDegree,
                      photoUrl: form.getValues("photoUrl") || null,
                    });
                    degreeNudge.markDone(loc);
                  }}
                  onApplyAll={async (value) => {
                    const allTranslations = Object.fromEntries(
                      OTHER_LOCALES[locale].map((loc) => [loc, value]),
                    );
                    const updatedDegree = {
                      ...form.getValues("degree"),
                      translations: {
                        ...form.getValues("degree").translations,
                        ...allTranslations,
                      },
                    };
                    form.setValue("degree", updatedDegree, {
                      shouldDirty: true,
                    });

                    await upsertHeader.mutateAsync({
                      ...form.getValues(),
                      degree: updatedDegree,
                      photoUrl: form.getValues("photoUrl") || null,
                    });
                    degreeNudge.markAllDone();
                  }}
                  onDismiss={() => degreeNudge.dismiss()}
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
