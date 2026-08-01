"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { AppLanguage } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import {
  resolvePrimaryLanguage,
  textTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import { buildEmptyTranslationMap } from "@/lib/i18n/translation-map";
import type { ProfileHeroEditorDTO } from "@/features/profile/lib/profile-hero-editor-dto";

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
        backgroundImageUrl: z.string().url().or(z.literal("")),
        heroSummaryTranslations: textTranslationMapSchema(
          primaryLang?.id,
          t("heroSummaryLabel"),
        ),
        aboutMeTranslations: textTranslationMapSchema(
          primaryLang?.id,
          t("aboutMeTitle"),
        ),
        titles: z.array(
          z.object({
            order: z.number().int().nonnegative(),
            translations: textTranslationMapSchema(
              primaryLang?.id,
              t("rotatingTitlesLabel"),
            ),
          }),
        ),
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
      backgroundImageUrl: initialData.backgroundImageUrl,
      heroSummaryTranslations: initialData.heroSummaryTranslations,
      aboutMeTranslations: initialData.aboutMeTranslations,
      titles:
        initialData.titles.length > 0
          ? initialData.titles
          : [
              {
                order: 0,
                translations: buildEmptyTranslationMap(languages, { text: "" }),
              },
            ],
    }),
    [initialData, languages],
  );

  const form = useForm<ProfileHeroFormValues>({
    resolver: zodResolver(profileHeroFormSchema),
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "titles",
  });

  const upsertProfileHero = api.profileAdmin.upsertHero.useMutation();

  const photoUrlValue = useWatch({ control: form.control, name: "photoUrl" });
  const fullNameValue = useWatch({ control: form.control, name: "fullName" });

  const handleSubmit = useCallback(
    (values: ProfileHeroFormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          const titlesPayload = values.titles
            .map((title, index) => ({
              order: index,
              translations: title.translations,
            }))
            .filter((title) =>
              Object.values(title.translations).some(
                (entry) => entry.text.trim() !== "",
              ),
            );

          await upsertProfileHero.mutateAsync({
            fullName: values.fullName,
            photoUrl: values.photoUrl,
            backgroundImageUrl: values.backgroundImageUrl,
            heroSummaryTranslations: values.heroSummaryTranslations,
            aboutMeTranslations: values.aboutMeTranslations,
            titles: titlesPayload,
          });

          await utils.profileAdmin.getHeroEditor.invalidate();
        } catch (err) {
          setServerError(err instanceof Error ? err.message : t("saveFailed"));
        }
      });
    },
    [t, upsertProfileHero, utils],
  );

  const handleAddTitle = useCallback(() => {
    append({
      order: fields.length,
      translations: buildEmptyTranslationMap(languages, { text: "" }),
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
                  {fields.map((field, index) => (
                    <SortableItem key={field.id} value={field.id}>
                      <div className="border-border bg-card flex items-start gap-3 rounded-lg border p-4">
                        <SortableItemHandle
                          aria-label={t("dragToReorder")}
                          className="text-muted-foreground mt-2 shrink-0 cursor-grab"
                        >
                          <GripVertical className="h-4 w-4" />
                        </SortableItemHandle>
                        <div className="min-w-0 flex-1">
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
                                  name={`titles.${index}.translations.${lang.id}.text`}
                                  render={({ field: textField }) => (
                                    <FormItem
                                      label={t("titleWithLanguage", {
                                        language: lang.name,
                                      })}
                                      inputId={`profile-hero-title-${index}-${lang.code}`}
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
                              </div>
                            );
                          })}
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
                  ))}
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

          <FormSection title={t("heroSummaryLabel")}>
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
                </div>
              );
            })}
          </FormSection>

          <FormSection title={t("aboutMeTitle")}>
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
                        inputId={`profile-about-${lang.code}`}
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
