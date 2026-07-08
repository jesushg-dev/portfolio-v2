"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { AppLanguage, CvAboutMe, CvHeader } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Plus, Trash2, User } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import type { HeroTitleEditorDTO } from "@/features/profile/server/hero-titles";
import {
  languageMapFromLocalized,
  localizedFromLanguageMap,
} from "@/features/profile/server/hero-titles";

const translationSchema = z.object({
  appLanguageId: z.string().min(1),
  text: z.string(),
});

const profileHeroFormSchema = z.object({
  fullName: z.string().min(1),
  photoUrl: z.string().url().or(z.literal("")),
  backgroundImageUrl: z.string().url().or(z.literal("")),
  heroSummaryTranslations: z.array(translationSchema),
  aboutMeTranslations: z.array(translationSchema),
  titles: z.array(
    z.object({
      order: z.number().int().nonnegative(),
      translations: z.array(translationSchema).min(1),
    }),
  ),
});

type ProfileHeroFormValues = z.infer<typeof profileHeroFormSchema>;

function createEmptyTranslations(languages: AppLanguage[]) {
  return languages.map((language) => ({
    appLanguageId: language.id,
    text: "",
  }));
}

function localizedToTranslations(
  value: unknown,
  languages: AppLanguage[],
  primaryCode: string,
) {
  const codes = languages.map((language) => language.code);
  const map = languageMapFromLocalized(value, codes);

  return languages.map((language) => ({
    appLanguageId: language.id,
    text: map[language.code] ?? map[primaryCode] ?? "",
  }));
}

function heroTitlesToFormValues(
  dto: HeroTitleEditorDTO | null | undefined,
  languages: AppLanguage[],
) {
  if (!dto?.titles.length) {
    return [
      {
        order: 0,
        translations: createEmptyTranslations(languages),
      },
    ];
  }

  return dto.titles.map((title) => ({
    order: title.order,
    translations: languages.map((language) => ({
      appLanguageId: language.id,
      text: title.translationsByLangId[language.id]?.text ?? "",
    })),
  }));
}

function translationsToLocalized(
  translations: { appLanguageId: string; text: string }[],
  languages: AppLanguage[],
  primaryLang: AppLanguage,
) {
  const valuesByCode = Object.fromEntries(
    languages.map((language) => {
      const translation = translations.find(
        (item) => item.appLanguageId === language.id,
      );
      return [language.code, translation?.text ?? ""];
    }),
  );

  return localizedFromLanguageMap(valuesByCode, primaryLang.code);
}

interface ProfileHeroFormProps {
  languages: AppLanguage[];
  header: CvHeader | null;
  aboutMe: CvAboutMe | null;
  heroTitles: HeroTitleEditorDTO | null;
}

export function ProfileHeroForm({
  languages,
  header,
  aboutMe,
  heroTitles,
}: ProfileHeroFormProps) {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const primaryLang =
    languages.find((language) => language.code === "en") ?? languages[0];

  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues = useMemo<ProfileHeroFormValues>(() => {
    const primaryCode = primaryLang?.code ?? "en";
    return {
      fullName: header?.fullName ?? "",
      photoUrl: header?.photoUrl ?? "",
      backgroundImageUrl: header?.backgroundImageUrl ?? "",
      heroSummaryTranslations: localizedToTranslations(
        header?.heroSummary,
        languages,
        primaryCode,
      ),
      aboutMeTranslations: localizedToTranslations(
        aboutMe?.aboutMe,
        languages,
        primaryCode,
      ),
      titles: heroTitlesToFormValues(heroTitles, languages),
    };
  }, [aboutMe?.aboutMe, header, heroTitles, languages, primaryLang?.code]);

  const form = useForm<ProfileHeroFormValues>({
    resolver: zodResolver(profileHeroFormSchema),
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "titles",
  });

  const upsertPortfolioHeader = api.cv.upsertPortfolioHeader.useMutation();
  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();
  const upsertHeroTitles = api.cv.upsertHeroTitles.useMutation();

  const activeLang = languages.find((language) => language.id === activeLangId);
  const heroSummaryIndex = form
    .watch("heroSummaryTranslations")
    .findIndex((item) => item.appLanguageId === activeLangId);
  const aboutMeIndex = form
    .watch("aboutMeTranslations")
    .findIndex((item) => item.appLanguageId === activeLangId);

  const photoUrlValue = form.watch("photoUrl");
  const fullNameValue = form.watch("fullName");

  const handleSubmit = useCallback(
    (values: ProfileHeroFormValues) => {
      if (!primaryLang) return;

      startTransition(async () => {
        setServerError(null);
        try {
          const heroSummary = translationsToLocalized(
            values.heroSummaryTranslations,
            languages,
            primaryLang,
          );
          const aboutMePayload = translationsToLocalized(
            values.aboutMeTranslations,
            languages,
            primaryLang,
          );

          const titlesPayload = values.titles
            .map((title, index) => ({
              order: index,
              translations: title.translations.map((translation) => ({
                appLanguageId: translation.appLanguageId,
                text: translation.text.trim(),
              })),
            }))
            .filter((title) =>
              title.translations.some((translation) => translation.text !== ""),
            );

          await upsertPortfolioHeader.mutateAsync({
            fullName: values.fullName,
            photoUrl: values.photoUrl || null,
            backgroundImageUrl: values.backgroundImageUrl || null,
            heroSummary: heroSummary.default ? heroSummary : null,
            clientImageAlt: header?.clientImageAlt
              ? (header.clientImageAlt as {
                  default: string;
                  translations?: Record<string, string>;
                })
              : null,
          });

          if (aboutMePayload.default) {
            await upsertAboutMe.mutateAsync({ aboutMe: aboutMePayload });
          }

          await upsertHeroTitles.mutateAsync({ titles: titlesPayload });

          await Promise.all([
            utils.cv.getMine.invalidate(),
            utils.cv.getHeroTitlesMine.invalidate(),
          ]);
        } catch (err) {
          setServerError(err instanceof Error ? err.message : t("saveFailed"));
        }
      });
    },
    [
      header?.clientImageAlt,
      languages,
      primaryLang,
      t,
      upsertAboutMe,
      upsertHeroTitles,
      upsertPortfolioHeader,
      utils,
    ],
  );

  const handleAddTitle = useCallback(() => {
    append({
      order: fields.length,
      translations: createEmptyTranslations(languages),
    });
  }, [append, fields.length, languages]);

  const handleRemoveTitle = useCallback(
    (index: number) => {
      if (fields.length <= 1) return;
      remove(index);
    },
    [fields.length, remove],
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
                <FormField
                  control={form.control}
                  name="backgroundImageUrl"
                  render={({ field }) => (
                    <FormItem
                      label={t("backgroundImageLabel")}
                      inputId="profile-hero-background-url"
                    >
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder={t("backgroundImagePlaceholder")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title={t("rotatingTitlesLabel")}
            description={t("rotatingTitlesHint")}
          >
            <Sortable
              value={fields}
              onMove={({ activeIndex, overIndex }) => {
                move(activeIndex, overIndex);
              }}
              getItemValue={(item) => item.id}
            >
              <SortableContent asChild>
                <div className="flex flex-col gap-3">
                  {fields.map((field, index) => {
                    const translationIndex = form
                      .getValues(`titles.${index}.translations`)
                      .findIndex((item) => item.appLanguageId === activeLangId);

                    return (
                      <SortableItem key={field.id} value={field.id}>
                        <div className="border-border bg-card flex items-start gap-3 rounded-lg border p-4">
                          <SortableItemHandle className="text-muted-foreground mt-2 shrink-0 cursor-grab">
                            <GripVertical className="h-4 w-4" />
                          </SortableItemHandle>
                          <div className="min-w-0 flex-1">
                            {translationIndex !== -1 && activeLang ? (
                              <FormField
                                control={form.control}
                                name={`titles.${index}.translations.${translationIndex}.text`}
                                render={({ field: textField }) => (
                                  <FormItem
                                    label={t("titleWithLanguage", {
                                      language: activeLang.name,
                                    })}
                                    inputId={`profile-hero-title-${index}-${activeLang.code}`}
                                  >
                                    <FormControl>
                                      <Input
                                        {...textField}
                                        placeholder={t("degreePlaceholder")}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleRemoveTitle(index)}
                            disabled={fields.length <= 1}
                            aria-label={t("removeTitle")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </SortableItem>
                    );
                  })}
                </div>
              </SortableContent>
            </Sortable>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              id="profile-hero-add-title"
              onClick={handleAddTitle}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("addTitle")}
            </Button>
          </FormSection>

          {heroSummaryIndex !== -1 && activeLang ? (
            <FormSection title={t("heroSummaryLabel")}>
              <FormField
                control={form.control}
                name={`heroSummaryTranslations.${heroSummaryIndex}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("heroSummaryWithLanguage", {
                      language: activeLang.name,
                    })}
                    inputId={`profile-hero-summary-${activeLang.code}`}
                    description={t("heroSummaryHint")}
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
            </FormSection>
          ) : null}

          {aboutMeIndex !== -1 && activeLang ? (
            <FormSection title={t("aboutMeTitle")}>
              <FormField
                control={form.control}
                name={`aboutMeTranslations.${aboutMeIndex}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("descriptionWithLanguage", {
                      language: activeLang.name,
                    })}
                    inputId={`profile-about-${activeLang.code}`}
                    description={t("aboutDescriptionHint")}
                  >
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        placeholder={t("aboutPlaceholder")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </FormSection>
          ) : null}
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
