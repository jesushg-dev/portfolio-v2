"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import {
  AdminFormLanguageBar,
  ReferenceSnippet,
  type LanguageProgress,
} from "@/components/admin/shared/admin-form-language-bar";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import {
  resolvePrimaryLanguage,
  textTranslationMapSchema,
  TextTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import {
  buildEmptyTranslationMap,
  textTranslationMapFromRows,
} from "@/lib/i18n/translation-map";
import type { AppLanguage } from "@prisma/client";

export const EducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degreeName: z.record(z.string(), z.object({ text: z.string() })),
  location: TextTranslationMapSchema.optional(),
  description: TextTranslationMapSchema.optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
  dates: z.string().optional(),
});

export type EducationInput = z.infer<typeof EducationSchema>;

export const EducationForm: FC<{
  languages: AppLanguage[];
  initial?: {
    id: string;
    institution: string;
    degreeName?: unknown;
    location?: unknown;
    description?: unknown;
    translations?: {
      appLanguageId: string;
      degreeName: string;
      location?: string | null;
      description?: string | null;
    }[];
    startYear?: number | null;
    endYear?: number | null;
    dates?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.education");
  const utils = api.useUtils();
  const create = api.cv.createEducation.useMutation();
  const update = api.cv.updateEducation.useMutation();
  const [isPending, startTransition] = useTransition();

  const [showOriginal, setShowOriginal] = useState(true);

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );
  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );

  const formSchema = useMemo(
    () =>
      z.object({
        institution: z.string().min(1, t("institution")),
        degreeName: textTranslationMapSchema(primaryLang?.id, t("degree")),
        location: TextTranslationMapSchema.optional(),
        description: TextTranslationMapSchema.optional(),
        startYear: z.number().int().optional(),
        endYear: z.number().int().optional(),
        dates: z.string().optional(),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<EducationInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institution: initial?.institution ?? "",
      degreeName: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.degreeName,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
      location: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.location,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
      description: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.description,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
      startYear: initial?.startYear ?? undefined,
      endYear: initial?.endYear ?? undefined,
      dates: initial?.dates ?? "",
    },
  });

  const startYear = useWatch({ control: form.control, name: "startYear" });
  const endYear = useWatch({ control: form.control, name: "endYear" });
  const dates = useWatch({ control: form.control, name: "dates" });

  const datesPreview = useMemo(() => {
    if (dates?.trim()) return dates;
    if (startYear) {
      return `${startYear} – ${endYear ?? "Present"}`;
    }
    return null;
  }, [dates, startYear, endYear]);

  const watchedDegrees = useWatch({
    control: form.control,
    name: "degreeName",
  });
  const watchedLocations = useWatch({
    control: form.control,
    name: "location",
  });
  const watchedDescriptions = useWatch({
    control: form.control,
    name: "description",
  });

  const isNonPrimary = activeLangId !== primaryLang?.id;

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const degreeText = watchedDegrees?.[lang.id]?.text?.trim();
      const degreeOk = Boolean(degreeText);
      const descText = watchedDescriptions?.[lang.id]?.text?.trim();
      const descOk = Boolean(descText);

      const completedCount = [degreeOk, descOk].filter(Boolean).length;

      return {
        id: lang.id,
        name: lang.name,
        code: lang.code,
        isBase: lang.id === primaryLang?.id,
        hasContent: completedCount > 0,
        completedCount,
        totalCount: 2,
      };
    });
  }, [languages, watchedDegrees, watchedDescriptions, primaryLang?.id]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress && !watchedDegrees?.[activeLangId]?.text?.trim()) {
    missingItems.push(t("degree"));
  }

  const primaryDegree = watchedDegrees?.[primaryLang?.id ?? ""]?.text;
  const primaryLocation = watchedLocations?.[primaryLang?.id ?? ""]?.text;
  const primaryDesc = watchedDescriptions?.[primaryLang?.id ?? ""]?.text;

  const handleSubmit = useCallback(
    (input: EducationInput) => {
      startTransition(async () => {
        try {
          if (initial?.id) {
            await update.mutateAsync({ id: initial.id, ...input });
          } else {
            await create.mutateAsync(input);
          }
          await utils.cv.getMine.invalidate();
          toast.success(t("save") || "Saved successfully");
          onSuccess();
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : t("saveFailed") || "Save failed",
          );
        }
      });
    },
    [initial, update, create, utils, t, onSuccess],
  );

  return (
    <Form {...form}>
      <FormRoot
        id="cv-education-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormContent>
          {/* Shared: Institution & Dates */}
          <FormSection title={t("sectionInstitutionDates")} uppercase>
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem
                  label={t("institution")}
                  inputId="education-institution"
                >
                  <Input
                    {...field}
                    placeholder="e.g. Universidad Nacional de Ingeniería"
                  />
                </FormItem>
              )}
            />

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startYear"
                render={({ field }) => (
                  <FormItem
                    label={t("startYear")}
                    inputId="education-start-year"
                  >
                    <Input
                      type="number"
                      min={1950}
                      max={2100}
                      placeholder="2017"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endYear"
                render={({ field }) => (
                  <FormItem label={t("endYear")} inputId="education-end-year">
                    <Input
                      type="number"
                      min={1950}
                      max={2100}
                      placeholder="2024"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-4">
              <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <FormItem
                    label={t("dates")}
                    description={t("datesHint")}
                    inputId="education-dates"
                  >
                    <Input {...field} placeholder="e.g. 2017 – 2024" />
                  </FormItem>
                )}
              />
              {datesPreview ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  {t("previewDates")}{" "}
                  <b className="text-foreground font-semibold">
                    {datesPreview}
                  </b>
                </p>
              ) : null}
            </div>
          </FormSection>

          {/* Translatable: Degree, Location & Description */}
          <FormSection title={t("sectionLocalizedText")} uppercase>
            <AdminFormLanguageBar
              languages={languageProgressList}
              activeLangId={activeLangId}
              onSelectLang={setActiveLangId}
              missingItems={missingItems}
              isNonPrimary={isNonPrimary}
              showOriginal={showOriginal}
              onToggleShowOriginal={setShowOriginal}
            />

            <div className="mt-4 space-y-4">
              {isNonPrimary && showOriginal && primaryDegree ? (
                <ReferenceSnippet
                  content={primaryDegree}
                  label={t("degree")}
                  onCopy={() =>
                    form.setValue(
                      `degreeName.${activeLangId}.text`,
                      primaryDegree,
                      { shouldDirty: true },
                    )
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`degreeName.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("degree")}
                    inputId={`education-degree-${activeLangId}`}
                  >
                    <Input {...field} placeholder="e.g. Computer Engineering" />
                  </FormItem>
                )}
              />

              {isNonPrimary && showOriginal && primaryLocation ? (
                <ReferenceSnippet
                  content={primaryLocation}
                  label={t("location")}
                  onCopy={() =>
                    form.setValue(
                      `location.${activeLangId}.text`,
                      primaryLocation,
                      { shouldDirty: true },
                    )
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`location.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("location")}
                    inputId={`education-location-${activeLangId}`}
                  >
                    <Input {...field} placeholder="e.g. Managua, Nicaragua" />
                  </FormItem>
                )}
              />

              {isNonPrimary && showOriginal && primaryDesc ? (
                <ReferenceSnippet
                  content={primaryDesc}
                  label={t("description")}
                  onCopy={() =>
                    form.setValue(
                      `description.${activeLangId}.text`,
                      primaryDesc,
                      { shouldDirty: true },
                    )
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`description.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("description")}
                    inputId={`education-description-${activeLangId}`}
                  >
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Key achievements, honors, or thesis topic…"
                    />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </FormContent>

        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
          submitId="cv-education-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};

export default EducationForm;
