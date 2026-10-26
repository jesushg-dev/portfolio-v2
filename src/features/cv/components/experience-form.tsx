"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import {
  AdminFormLanguageBar,
  ReferenceSnippet,
  type LanguageProgress,
} from "@/components/admin/shared/admin-form-language-bar";
import { SkillPicker, type SkillOption } from "@/components/admin/skill-picker";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { Form, FormControl, FormField } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  CV_EMPLOYMENT_TYPES,
  CvEmploymentTypeSchema,
  normalizeEmploymentType,
} from "@/features/cv/lib/employment-type";
import type { AppLanguage } from "@prisma/client";

export function buildExperienceFormSchema(
  primaryLangId?: string,
  messages?: { role?: string; responsibility?: string },
) {
  return z.object({
    company: z.string().min(1, "Company is required"),
    companyLogoUrl: z.string().url().or(z.literal("")).optional(),
    employmentType: CvEmploymentTypeSchema,
    role: textTranslationMapSchema(primaryLangId, messages?.role ?? "Role"),
    location: TextTranslationMapSchema.optional(),
    companyBlurb: TextTranslationMapSchema.optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    current: z.boolean(),
    featuredOnHome: z.boolean(),
    skillIds: z.array(z.string()),
    responsibilities: z.array(
      z.object({
        text: textTranslationMapSchema(
          primaryLangId,
          messages?.responsibility ?? "Responsibility",
        ),
        order: z.number().int().nonnegative(),
        atsOnly: z.boolean(),
      }),
    ),
  });
}

export type ExperienceInput = z.infer<
  ReturnType<typeof buildExperienceFormSchema>
>;

interface ExperienceInitial {
  id: string;
  company: string;
  companyLogoUrl?: string | null;
  employmentType?: string | null;
  role?: unknown;
  location?: unknown;
  translations?: {
    appLanguageId: string;
    role: string;
    location?: string | null;
    companyBlurb?: string | null;
  }[];
  startDate?: Date | null;
  endDate?: Date | null;
  current?: boolean;
  featuredOnHome?: boolean;
  skills?: string | null;
  CvExperienceSkill?: { skillId: string }[];
  responsibilities?: {
    id?: string;
    text?: unknown;
    atsOnly?: boolean;
    translations?: { appLanguageId: string; text: string }[];
    order: number;
  }[];
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
              field.value ? new Date(field.value).toISOString().slice(0, 7) : ""
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

  const [activeTab, setActiveTab] = useState<"general" | "content" | "skills">(
    "general",
  );
  const [showOriginal, setShowOriginal] = useState(true);

  const { data: { data: availableSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});

  const skillOptions: SkillOption[] = useMemo(
    () =>
      availableSkills.map((s) => ({
        id: s.id,
        title: s.title,
        image: s.image,
        type: s.type,
      })),
    [availableSkills],
  );

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );
  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );

  const formSchema = useMemo(
    () =>
      buildExperienceFormSchema(primaryLang?.id, {
        role: t("role"),
        responsibility: t("responsibility", { n: 1 }),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<ExperienceInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: initial?.company ?? "",
      companyLogoUrl: initial?.companyLogoUrl ?? "",
      employmentType: normalizeEmploymentType(initial?.employmentType),
      role: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.role,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
      location: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.location,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
      companyBlurb: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.companyBlurb,
          )
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
            text: textTranslationMapFromRows(
              languages,
              r.translations,
              (row) => row.text,
            ),
            order: index,
            atsOnly: r.atsOnly ?? false,
          })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "responsibilities",
  });

  const selectedSkills = useWatch({ control: form.control, name: "skillIds" });
  const watchedRoles = useWatch({ control: form.control, name: "role" });
  const watchedLocations = useWatch({
    control: form.control,
    name: "location",
  });
  const watchedBlurbs = useWatch({
    control: form.control,
    name: "companyBlurb",
  });
  const watchedResponsibilities = useWatch({
    control: form.control,
    name: "responsibilities",
  });

  const isNonPrimary = activeLangId !== primaryLang?.id;

  // Compute language progress for AdminFormLanguageBar
  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const roleText = watchedRoles?.[lang.id]?.text?.trim();
      const roleOk = Boolean(roleText);
      const resps = watchedResponsibilities ?? [];
      const respsOk =
        resps.length === 0 ||
        resps.every((r) => Boolean(r.text?.[lang.id]?.text?.trim()));

      const completedCount = [roleOk, respsOk].filter(Boolean).length;

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
  }, [languages, watchedRoles, watchedResponsibilities, primaryLang?.id]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress) {
    if (!watchedRoles?.[activeLangId]?.text?.trim()) {
      missingItems.push(t("role"));
    }
  }

  const primaryRole = watchedRoles?.[primaryLang?.id ?? ""]?.text;
  const primaryLocation = watchedLocations?.[primaryLang?.id ?? ""]?.text;
  const primaryBlurb = watchedBlurbs?.[primaryLang?.id ?? ""]?.text;

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
        <FormContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "general" | "content" | "skills")
            }
            className="w-full"
          >
            <TabsList variant="line" className="mb-5 w-fit justify-start">
              <TabsTrigger value="general" className="text-sm">
                {t("tabGeneral")}
              </TabsTrigger>
              <TabsTrigger value="content" className="text-sm">
                {t("tabContent")}
              </TabsTrigger>
              <TabsTrigger value="skills" className="text-sm">
                {t("tabSkills")}{" "}
                <span className="bg-primary/10 text-primary ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {selectedSkills.length}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: GENERAL */}
            <TabsContent value="general" className="mt-0 space-y-6">
              <p className="text-muted-foreground -mt-2 text-xs">
                {t("contentHint")}
              </p>
              <FormSection title={t("sectionCompany")} uppercase>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem
                        label={t("company")}
                        inputId="experience-company"
                      >
                        <Input
                          {...field}
                          placeholder={t("companyPlaceholder")}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem
                        label={t("employmentType")}
                        inputId="experience-employment-type"
                      >
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="experience-employment-type"
                              className="w-full"
                            >
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CV_EMPLOYMENT_TYPES.map((type) => (
                              <SelectItem
                                key={type}
                                value={type}
                                id={`experience-employment-type-option-${type}`}
                              >
                                {t(`employmentTypes.${type}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyLogoUrl"
                  render={({ field }) => (
                    <FormItem
                      label={t("companyLogo")}
                      inputId="experience-company-logo"
                      className="mt-4"
                    >
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://.../logo.png"
                      />
                    </FormItem>
                  )}
                />
              </FormSection>

              <FormSection title={t("sectionDates")} uppercase>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </FormSection>

              <FormSection title={t("sectionVisibility")} uppercase>
                <div className="border-border bg-card/60 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <FormField
                    control={form.control}
                    name="current"
                    render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Switch
                          id="experience-current"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="experience-current"
                          className="text-foreground cursor-pointer text-sm font-medium"
                        >
                          {t("currentlyWorking")}
                        </label>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featuredOnHome"
                    render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Switch
                          id="experience-featured-home"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="experience-featured-home"
                          className="text-foreground cursor-pointer text-sm font-medium"
                        >
                          {t("featuredOnHome")}
                        </label>
                      </div>
                    )}
                  />
                </div>
              </FormSection>
            </TabsContent>

            {/* TAB 2: CONTENT */}
            <TabsContent value="content" className="mt-0 space-y-6">
              <AdminFormLanguageBar
                languages={languageProgressList}
                activeLangId={activeLangId}
                onSelectLang={setActiveLangId}
                missingItems={missingItems}
                isNonPrimary={isNonPrimary}
                showOriginal={showOriginal}
                onToggleShowOriginal={setShowOriginal}
              />

              <FormSection title={t("tabContent")} uppercase>
                {isNonPrimary && showOriginal && primaryRole ? (
                  <ReferenceSnippet
                    content={primaryRole}
                    label={t("role")}
                    onCopy={() =>
                      form.setValue(`role.${activeLangId}.text`, primaryRole, {
                        shouldDirty: true,
                      })
                    }
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name={`role.${activeLangId}.text`}
                  render={({ field }) => (
                    <FormItem
                      label={t("role")}
                      inputId={`experience-role-${activeLangId}`}
                    >
                      <Input {...field} placeholder={t("rolePlaceholder")} />
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
                      inputId={`experience-location-${activeLangId}`}
                    >
                      <Input {...field} placeholder="e.g. Remote · San José" />
                    </FormItem>
                  )}
                />

                {isNonPrimary && showOriginal && primaryBlurb ? (
                  <ReferenceSnippet
                    content={primaryBlurb}
                    label="Company Context (ATS only)"
                    onCopy={() =>
                      form.setValue(
                        `companyBlurb.${activeLangId}.text`,
                        primaryBlurb,
                        { shouldDirty: true },
                      )
                    }
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name={`companyBlurb.${activeLangId}.text`}
                  render={({ field }) => (
                    <FormItem
                      label="Company Context"
                      description="Brief note for ATS vacancy tailoring; excluded from public CV."
                      inputId={`experience-blurb-${activeLangId}`}
                    >
                      <Textarea {...field} rows={2} />
                    </FormItem>
                  )}
                />
              </FormSection>

              {/* Responsibilities Section */}
              <FormSection
                title={t("responsibilitiesHeading", { count: fields.length })}
                uppercase
              >
                <p className="text-muted-foreground -mt-2 text-xs">
                  {t("responsibilitiesHint")}
                </p>

                <Sortable
                  value={fields}
                  onValueChange={(newItems) => {
                    const currentValues = form.getValues("responsibilities");
                    const reordered = newItems.map((item, index) => {
                      const orig =
                        currentValues.find((v) => v.order === item.order) ??
                        item;
                      return { ...orig, order: index };
                    });
                    form.setValue("responsibilities", reordered, {
                      shouldDirty: true,
                    });
                  }}
                  getItemValue={(item) => String(item.id)}
                >
                  <SortableContent asChild>
                    <div className="mt-3 flex flex-col gap-3">
                      {fields.map((fieldItem, idx) => {
                        const baseRespText = primaryLang?.id
                          ? watchedResponsibilities?.[idx]?.text?.[
                              primaryLang.id
                            ]?.text
                          : undefined;

                        return (
                          <SortableItem
                            key={fieldItem.id}
                            value={String(fieldItem.id)}
                            asChild
                          >
                            <div className="border-border bg-card/60 rounded-xl border p-3.5 shadow-2xs">
                              <div className="flex items-start gap-3">
                                <SortableItemHandle
                                  aria-label={t("dragToReorder")}
                                  className="text-muted-foreground hover:text-foreground mt-2 shrink-0 cursor-grab"
                                >
                                  <GripVertical className="size-4" />
                                </SortableItemHandle>

                                <span className="bg-primary/10 text-primary mt-1.5 grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums">
                                  {idx + 1}
                                </span>

                                <div className="min-w-0 flex-1 space-y-2">
                                  {isNonPrimary &&
                                  showOriginal &&
                                  baseRespText ? (
                                    <ReferenceSnippet
                                      content={baseRespText}
                                      label={`Responsibility #${idx + 1}`}
                                      onCopy={() =>
                                        form.setValue(
                                          `responsibilities.${idx}.text.${activeLangId}.text`,
                                          baseRespText,
                                          { shouldDirty: true },
                                        )
                                      }
                                    />
                                  ) : null}

                                  <FormField
                                    control={form.control}
                                    name={`responsibilities.${idx}.text.${activeLangId}.text`}
                                    render={({ field: textField }) => (
                                      <FormItem
                                        label={t("responsibility", {
                                          n: idx + 1,
                                        })}
                                        inputId={`experience-resp-${idx}-${activeLangId}`}
                                      >
                                        <Textarea
                                          {...textField}
                                          rows={2}
                                          placeholder={t(
                                            "responsibilityPlaceholder",
                                          )}
                                        />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-t pt-2">
                                    <FormField
                                      control={form.control}
                                      name={`responsibilities.${idx}.atsOnly`}
                                      render={({ field: atsField }) => (
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            id={`experience-resp-ats-${idx}`}
                                            checked={atsField.value}
                                            onCheckedChange={atsField.onChange}
                                          />
                                          <label
                                            htmlFor={`experience-resp-ats-${idx}`}
                                            className="text-muted-foreground cursor-pointer text-xs font-medium"
                                          >
                                            {t("onlyAts")}
                                          </label>
                                        </div>
                                      )}
                                    />

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => remove(idx)}
                                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 text-xs"
                                    >
                                      <Trash2 className="mr-1 size-3.5" />
                                      {t("remove")}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </div>
                  </SortableContent>
                </Sortable>

                <Button
                  id="experience-add-responsibility"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      text: buildEmptyTranslationMap(languages, { text: "" }),
                      order: fields.length,
                      atsOnly: false,
                    })
                  }
                  className="mt-3 gap-1.5"
                >
                  <Plus className="size-4" />
                  {t("addResponsibility")}
                </Button>
              </FormSection>
            </TabsContent>

            {/* TAB 3: SKILLS */}
            <TabsContent value="skills" className="mt-0">
              <FormSection title={t("skillsHeading")} uppercase>
                <p className="text-muted-foreground -mt-2 mb-4 text-xs">
                  {t("skillsHint")}
                </p>

                <FormField
                  control={form.control}
                  name="skillIds"
                  render={({ field }) => (
                    <SkillPicker
                      availableSkills={skillOptions}
                      selectedSkillIds={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormSection>
            </TabsContent>
          </Tabs>
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

export default ExperienceForm;
