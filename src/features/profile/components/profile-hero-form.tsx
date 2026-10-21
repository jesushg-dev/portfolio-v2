"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { AppLanguage } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  resolvePrimaryLanguage,
  textTranslationMapSchema,
  TextTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import type { ProfileHeroEditorDTO } from "@/features/profile/lib/profile-hero-editor-dto";
import { ProfileHeroPreview } from "./profile-hero-preview";

interface ProfileHeroFormProps {
  languages: AppLanguage[];
  initialData: ProfileHeroEditorDTO;
}

export function ProfileHeroForm({
  languages,
  initialData,
}: ProfileHeroFormProps) {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const profileHeroFormSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(1),
        photoUrl: z.string().url().or(z.literal("")),
        heroSubtitleTranslations: textTranslationMapSchema(
          primaryLang?.id,
          t("heroSubtitleLabel"),
        ),
        heroTaglineTranslations: textTranslationMapSchema(
          primaryLang?.id,
          t("heroTaglineLabel"),
        ),
        heroSummaryTranslations: TextTranslationMapSchema,
        clientImageAltTranslations: TextTranslationMapSchema,
        heroBadgeTranslations: TextTranslationMapSchema,
      }),
    [primaryLang?.id, t],
  );

  type ProfileHeroFormValues = z.infer<typeof profileHeroFormSchema>;

  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues = useMemo<ProfileHeroFormValues>(
    () => ({
      fullName: initialData.fullName,
      photoUrl: initialData.photoUrl,
      heroSubtitleTranslations: initialData.heroSubtitleTranslations,
      heroTaglineTranslations: initialData.heroTaglineTranslations,
      heroSummaryTranslations: initialData.heroSummaryTranslations,
      clientImageAltTranslations: initialData.clientImageAltTranslations,
      heroBadgeTranslations: initialData.heroBadgeTranslations,
    }),
    [initialData],
  );

  const form = useForm<ProfileHeroFormValues>({
    resolver: zodResolver(profileHeroFormSchema),
    defaultValues,
  });

  const upsertProfileHero = api.profileAdmin.upsertHero.useMutation();

  const photoUrlValue = useWatch({ control: form.control, name: "photoUrl" });
  const fullNameValue = useWatch({ control: form.control, name: "fullName" });
  const heroSubtitleTranslations = useWatch({
    control: form.control,
    name: "heroSubtitleTranslations",
  });
  const heroTaglineTranslations = useWatch({
    control: form.control,
    name: "heroTaglineTranslations",
  });
  const heroSummaryTranslations = useWatch({
    control: form.control,
    name: "heroSummaryTranslations",
  });
  const clientImageAltTranslations = useWatch({
    control: form.control,
    name: "clientImageAltTranslations",
  });
  const heroBadgeTranslations = useWatch({
    control: form.control,
    name: "heroBadgeTranslations",
  });

  const activeSubtitle = heroSubtitleTranslations?.[activeLangId]?.text ?? "";
  const activeTagline = heroTaglineTranslations?.[activeLangId]?.text ?? "";
  const activeSummary = heroSummaryTranslations?.[activeLangId]?.text ?? "";
  const activeImageAlt = clientImageAltTranslations?.[activeLangId]?.text ?? "";
  const activeBadge = heroBadgeTranslations?.[activeLangId]?.text ?? "";

  const handleSubmit = useCallback(
    (values: ProfileHeroFormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          await upsertProfileHero.mutateAsync({
            fullName: values.fullName,
            photoUrl: values.photoUrl,
            heroSubtitleTranslations: values.heroSubtitleTranslations,
            heroTaglineTranslations: values.heroTaglineTranslations,
            heroSummaryTranslations: values.heroSummaryTranslations,
            clientImageAltTranslations: values.clientImageAltTranslations,
            heroBadgeTranslations: values.heroBadgeTranslations,
          });

          await utils.profileAdmin.getHeroEditor.invalidate();
        } catch (err) {
          setServerError(err instanceof Error ? err.message : t("saveFailed"));
        }
      });
    },
    [t, upsertProfileHero, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="profile-hero"
        />

        {/* Live Hero Preview Component */}
        <div className="space-y-2">
          <h2 className="text-foreground text-sm font-semibold">
            {t("heroPreviewTitle")}
          </h2>
          <ProfileHeroPreview
            fullName={fullNameValue}
            photoUrl={photoUrlValue}
            imageAlt={activeImageAlt}
            heroSubtitle={activeSubtitle}
            heroTagline={activeTagline}
            heroSummary={activeSummary}
            badgeLabel={activeBadge}
          />
        </div>

        <FormContent error={serverError}>
          {/* Identity Section: Name, Photo, Image Alt */}
          <FormSection title={t("heroSection")}>
            <div className="flex items-start gap-6">
              <div className="mt-2 shrink-0">
                {photoUrlValue ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrlValue}
                    alt={activeImageAlt.trim() || fullNameValue}
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
                    <FormItem
                      label={t("fullNameLabel")}
                      inputId="profile-hero-full-name"
                    >
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("fullNamePlaceholder")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem
                      label={t("photoUrlLabel")}
                      inputId="profile-hero-photo-url"
                    >
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder={t("photoUrlPlaceholder")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {languages.map((lang) => {
              const isActive = lang.id === activeLangId;
              return (
                <div
                  key={lang.id}
                  className={isActive ? "mt-4 block" : "hidden"}
                  aria-hidden={!isActive}
                >
                  <FormField
                    control={form.control}
                    name={`clientImageAltTranslations.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("altTextLabel")}
                        inputId={`profile-hero-photo-alt-${lang.code}`}
                        description={t("altTextHint")}
                      >
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("altTextPlaceholder")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </FormSection>

          {/* Availability Badge Pill */}
          <FormSection
            title={t("heroBadgeLabel")}
            description={t("heroBadgeHint")}
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
                    name={`heroBadgeTranslations.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("heroBadgeWithLanguage", {
                          language: lang.name,
                        })}
                        inputId={`profile-hero-badge-${lang.code}`}
                        description={t("heroBadgeHint")}
                      >
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("heroBadgePlaceholder")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </FormSection>

          {/* Professional Subtitle (H2 in Hero) */}
          <FormSection
            title={t("heroSubtitleLabel")}
            description={t("heroSubtitleHint")}
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
                    name={`heroSubtitleTranslations.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("heroSubtitleWithLanguage", {
                          language: lang.name,
                        })}
                        inputId={`profile-hero-subtitle-${lang.code}`}
                      >
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("heroSubtitlePlaceholder")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </FormSection>

          {/* Tagline / Value Proposition (Main highlighted paragraph in Hero) */}
          <FormSection
            title={t("heroTaglineLabel")}
            description={t("heroTaglineHint")}
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
                    name={`heroTaglineTranslations.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("heroTaglineWithLanguage", {
                          language: lang.name,
                        })}
                        inputId={`profile-hero-tagline-${lang.code}`}
                      >
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder={t("heroTaglinePlaceholder")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </FormSection>

          {/* Secondary Hero Summary */}
          <FormSection
            title={t("heroSummaryLabel")}
            description={t("heroSummaryHint")}
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
                    name={`heroSummaryTranslations.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("heroSummaryWithLanguage", {
                          language: lang.name,
                        })}
                        inputId={`profile-hero-summary-${lang.code}`}
                      >
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder={t("heroSummaryPlaceholder")}
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
          submitId="profile-hero-submit"
        />
      </FormRoot>
    </Form>
  );
}
