"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import { SkillPicker } from "@/components/admin/skill-picker";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { GripVertical } from "lucide-react";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormActions,
  FormCheckboxItem,
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

export const ResponsibilitySchema = z.object({
  text: z.record(z.string(), z.object({ text: z.string() })),
  order: z.number().int().nonnegative(),
});

export const ExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.record(z.string(), z.object({ text: z.string() })),
  location: TextTranslationMapSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  current: z.boolean(),
  featuredOnHome: z.boolean(),
  skillIds: z.array(z.string()),
  responsibilities: z.array(ResponsibilitySchema),
});

export type ExperienceInput = z.infer<typeof ExperienceSchema>;

interface ExperienceInitial {
  id: string;
  company: string;
  role: unknown;
  location: unknown;
  startDate?: Date | null;
  endDate?: Date | null;
  current?: boolean;
  featuredOnHome?: boolean;
  skills?: string | null;
  CvExperienceSkill?: { skillId: string }[];
  responsibilities: { text: unknown; order: number }[];
}

function EndDateInput({
  control,
  label,
}: {
  control: Control<ExperienceInput>;
  label: string;
}) {
  const isCurrent = useWatch({ control, name: "current" });

  return (
    <FormField
      control={control}
      name="endDate"
      render={({ field }) => (
        <FormItem label={label} inputId="experience-end-date">
          <Input
            type="month"
            value={
              field.value
                ? new Date(field.value).toISOString().slice(0, 7)
                : ""
            }
            onChange={(e) =>
              field.onChange(
                e.target.value ? new Date(e.target.value) : undefined,
              )
            }
            disabled={isCurrent}
          />
        </FormItem>
      )}
    />
  );
}

export const ExperienceForm: FC<{
  languages: AppLanguage[];
  initial?: ExperienceInitial;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.experience");
  const utils = api.useUtils();
  const create = api.cv.createExperience.useMutation();
  const update = api.cv.updateExperience.useMutation();
  const [isPending, startTransition] = useTransition();

  const { data: { data: availableSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});

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
        company: z.string().min(1),
        role: textTranslationMapSchema(primaryLang?.id, t("role")),
        location: TextTranslationMapSchema.optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        current: z.boolean(),
        featuredOnHome: z.boolean(),
        skillIds: z.array(z.string()),
        responsibilities: z.array(
          z.object({
            text: textTranslationMapSchema(
              primaryLang?.id,
              t("responsibility", { n: 1 }),
            ),
            order: z.number().int().nonnegative(),
          }),
        ),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<ExperienceInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: initial?.company ?? "",
      role: initial
        ? localizedJsonToTextMap(initial.role, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
      location: initial?.location
        ? localizedJsonToTextMap(initial.location, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
      startDate: initial?.startDate ?? undefined,
      endDate: initial?.endDate ?? undefined,
      current: initial?.current ?? false,
      featuredOnHome: initial?.featuredOnHome ?? false,
      skillIds: initial?.CvExperienceSkill?.map((row) => row.skillId) ?? [],
      responsibilities:
        initial?.responsibilities
          ?.sort((a, b) => a.order - b.order)
          .map((r, index) => ({
            text: localizedJsonToTextMap(r.text, languages),
            order: index,
          })) ?? [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "responsibilities",
  });

  const handleSubmit = useCallback(
    (input: ExperienceInput) => {
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
        id="cv-experience-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="cv-experience"
        />

        <FormContent>
          <FormSection title={t("company")}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem label={t("company")} inputId="experience-company">
                    <Input {...field} />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem
                      label={t("startDate")}
                      inputId="experience-start-date"
                    >
                      <Input
                        type="month"
                        value={
                          field.value
                            ? new Date(field.value).toISOString().slice(0, 7)
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormItem>
                  )}
                />
                <EndDateInput control={form.control} label={t("endDate")} />
              </div>
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="experience-current"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="experience-current"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("current")}
                    </label>
                  </div>
                )}
              />
            </div>

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
                    name={`role.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("role")}
                        inputId={`experience-role-${lang.code}`}
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
                        inputId={`experience-location-${lang.code}`}
                      >
                        <Input {...field} />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}

            <FormField
              control={form.control}
              name="skillIds"
              render={({ field }) => (
                <FormItem label={t("skills")} inputId="experience-skill-picker">
                  <div id="experience-skill-picker">
                    <SkillPicker
                      availableSkills={availableSkills.map((skill) => ({
                        id: skill.id,
                        title: skill.title,
                        image: skill.image,
                        type: skill.type,
                      }))}
                      selectedSkillIds={field.value}
                      onChange={field.onChange}
                    />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current"
              render={({ field }) => (
                <FormCheckboxItem label={t("current")}>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                </FormCheckboxItem>
              )}
            />

            <FormField
              control={form.control}
              name="featuredOnHome"
              render={({ field }) => (
                <FormCheckboxItem
                  label={t("featuredOnHome")}
                  description={t("featuredOnHomeDescription")}
                >
                  <Checkbox
                    id="experience-featured-on-home"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                </FormCheckboxItem>
              )}
            />
          </FormSection>

          <FormSection
            title={t("responsibilities")}
            className="mt-4 border-t pt-4"
          >
            <Sortable
              value={fields}
              onMove={({ activeIndex, overIndex }) => {
                move(activeIndex, overIndex);
              }}
              getItemValue={(item) => item.id}
            >
              <SortableContent asChild>
                <div className="flex flex-col gap-0">
                  {fields.map((field, idx) => (
                    <SortableItem key={field.id} value={field.id} asChild>
                      <div className="border-border/70 flex flex-col gap-3 border-t pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-start gap-2">
                          <SortableItemHandle className="text-muted-foreground hover:text-foreground mt-8">
                            <GripVertical className="size-4" />
                          </SortableItemHandle>
                          <div className="flex-1">
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
                                    name={`responsibilities.${idx}.text.${lang.id}.text`}
                                    render={({ field: textField }) => (
                                      <FormItem
                                        label={t("responsibility", {
                                          n: idx + 1,
                                        })}
                                        inputId={`experience-responsibility-${idx}-${lang.code}`}
                                      >
                                        <Textarea {...textField} rows={3} />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-8 h-8 text-xs"
                          >
                            {t("remove")}
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContent>
            </Sortable>
            <Button
              id="experience-add-responsibility"
              variant="outline"
              type="button"
              onClick={() =>
                append({
                  text: buildEmptyTranslationMap(languages, { text: "" }),
                  order: fields.length,
                })
              }
              className="mt-4"
            >
              {t("addResponsibility")}
            </Button>
          </FormSection>
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
          submitId="cv-experience-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
