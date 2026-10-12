"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { AppLanguage } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { z } from "zod";

import { api } from "@/trpc/react";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  resolvePrimaryLanguage,
  textTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import type { ProfileAboutEditorDTO } from "@/features/profile/lib/profile-hero-editor-dto";

interface AboutBioFormProps {
  languages: AppLanguage[];
  initialData: ProfileAboutEditorDTO;
}

export function AboutBioForm({ languages, initialData }: AboutBioFormProps) {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const aboutBioFormSchema = useMemo(
    () =>
      z.object({
        aboutMeTranslations: textTranslationMapSchema(
          primaryLang?.id,
          t("aboutBioTitle"),
        ),
      }),
    [primaryLang?.id, t],
  );

  type AboutBioFormValues = z.infer<typeof aboutBioFormSchema>;

  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues = useMemo<AboutBioFormValues>(
    () => ({
      aboutMeTranslations: initialData.aboutMeTranslations,
    }),
    [initialData],
  );

  const form = useForm<AboutBioFormValues>({
    resolver: zodResolver(aboutBioFormSchema),
    defaultValues,
  });

  const upsertAbout = api.profileAdmin.upsertAbout.useMutation();

  const handleSubmit = useCallback(
    (values: AboutBioFormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          await upsertAbout.mutateAsync({
            aboutMeTranslations: values.aboutMeTranslations,
          });

          await Promise.all([
            utils.profileAdmin.getAboutEditor.invalidate(),
            utils.portfolio.getAboutPublic.invalidate(),
          ]);
        } catch (err) {
          setServerError(err instanceof Error ? err.message : t("saveFailed"));
        }
      });
    },
    [t, upsertAbout, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="profile-about-bio"
        />

        {/* Formatting hint callout */}
        <div className="border-border/80 bg-muted/40 text-foreground flex items-start gap-3 rounded-xl border p-4 text-sm">
          <Sparkles
            className="text-primary mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <strong className="text-foreground block font-semibold">
              {t("aboutBioTitle")}
            </strong>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t("aboutBioSubtitle")}
            </p>
          </div>
        </div>

        <FormContent error={serverError}>
          <FormSection
            title={t("aboutMeTitle")}
            description={t("aboutDescriptionHint")}
          >
            {languages.map((lang) => {
              const isActive = lang.id === activeLangId;
              return (
                <div
                  key={lang.id}
                  className={isActive ? "block" : "hidden"}
                  aria-hidden={!isActive}
                >
                  <FormField
                    control={form.control}
                    name={`aboutMeTranslations.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("descriptionWithLanguage", {
                          language: lang.name,
                        })}
                        inputId={`profile-about-narrative-${lang.code}`}
                        description={t("aboutDescriptionHint")}
                      >
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={8}
                            placeholder={t("aboutPlaceholder")}
                            className="font-sans leading-relaxed"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending}
          title={isPending ? t("saving") : t("save")}
          submitId="profile-about-bio-submit"
        />
      </FormRoot>
    </Form>
  );
}
