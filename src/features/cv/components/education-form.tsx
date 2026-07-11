"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
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
} from "@/lib/i18n/localized-form";
import { buildEmptyTranslationMap } from "@/lib/i18n/translation-map";
import {
  localizedJsonToTextMap,
  TextTranslationMapSchema,
} from "@/lib/i18n/localized-text-map";
import type { AppLanguage } from "@prisma/client";

export const EducationSchema = z.object({
  institution: z.string().min(1),
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
    degreeName: unknown;
    location: unknown;
    description: unknown;
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
        institution: z.string().min(1),
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
      degreeName: initial
        ? localizedJsonToTextMap(initial.degreeName, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
      location: initial?.location
        ? localizedJsonToTextMap(initial.location, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
      description: initial?.description
        ? localizedJsonToTextMap(initial.description, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
      startYear: initial?.startYear ?? undefined,
      endYear: initial?.endYear ?? undefined,
      dates: initial?.dates ?? "",
    },
  });

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
          toast.success(t("save"));
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
    [create, initial, onSuccess, t, update, utils],
  );

  return (
    <Form {...form}>
      <FormRoot
        id="cv-education-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="cv-education"
        />

        <FormContent>
          <FormSection title={t("institution")}>
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem
                  label={t("institution")}
                  inputId="education-institution"
                >
                  <Input {...field} />
                </FormItem>
              )}
            />

            {languages.map((lang) => {
              const isActive = lang.id === activeLangId;
              return (
                <div
                  key={lang.id}
                  className={isActive ? "space-y-4" : "hidden"}
                  aria-hidden={!isActive}
                >
                  <FormField
                    control={form.control}
                    name={`degreeName.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("degree")}
                        inputId={`education-degree-${lang.code}`}
                      >
                        <Input {...field} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`location.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("location")}
                        inputId={`education-location-${lang.code}`}
                      >
                        <Input {...field} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`description.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("description")}
                        inputId={`education-description-${lang.code}`}
                      >
                        <Textarea {...field} rows={4} />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}

            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || undefined)
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
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || undefined)
                      }
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <FormItem label={t("dates")} inputId="education-dates">
                    <Input placeholder="2017 - 2024" {...field} />
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
