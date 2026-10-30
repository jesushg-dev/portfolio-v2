"use client";

import { type FC, useTransition, useMemo, useCallback, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  useForm,
  useFieldArray,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import {
  AdminFormLanguageBar,
  ReferenceSnippet,
  AdminFormEmptyTranslation,
  AdminFormDeleteTranslation,
  type LanguageProgress,
} from "@/components/admin/shared/admin-form-language-bar";
import { SkillPicker, type SkillOption } from "@/components/admin/skill-picker";
import {
  resolvePrimaryLanguage,
  titleDescriptionTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import {
  type TimelineCreateFormDTO,
  type TimelineFormDTO,
} from "@/features/timeline/lib/timeline-editor-dto";
import { api } from "@/trpc/react";
import type { AppLanguage } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types & Schema
// ---------------------------------------------------------------------------

interface TimelineItemFormProps {
  languages: AppLanguage[];
  initialData: TimelineFormDTO | TimelineCreateFormDTO;
}

type TTranslations = ReturnType<
  typeof useTranslations<"admin.forms.timelineItem">
>;

const roleSchema = z.object({
  title: z.string(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
});

function createTimelineFormSchema(
  t: TTranslations,
  primaryLangId: string | undefined,
) {
  return z.object({
    id: z.string().optional(),
    organization: z.string().min(1, t("organizationRequired")),
    location: z.string().optional().or(z.literal("")),
    category: z.enum(["WORK", "STUDY", "COURSE"]),
    startDate: z.string().min(1, t("startDateRequired")),
    endDate: z.string().optional().or(z.literal("")),
    current: z.boolean(),
    images: z.array(
      z.object({
        url: z.string().url(t("imageUrlInvalid")).or(z.literal("")),
      }),
    ),
    roles: z.array(roleSchema).default([]),
    skillIds: z.array(z.string()).default([]),
    translations: titleDescriptionTranslationMapSchema(
      primaryLangId,
      t("titleRequiredPrimary"),
    ),
  });
}

type TimelineFormValues = z.infer<ReturnType<typeof createTimelineFormSchema>>;

// ---------------------------------------------------------------------------
// Main Component: TimelineItemForm
// ---------------------------------------------------------------------------

export const TimelineItemForm: FC<TimelineItemFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.timelineItem");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("general");

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const [activeLangId, setActiveLangId] = useState<string>(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );
  const [showOriginal, setShowOriginal] = useState(true);

  const formSchema = useMemo(
    () => createTimelineFormSchema(t, primaryLang?.id),
    [primaryLang?.id, t],
  );

  const { data: { data: rawSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});

  const availableSkills: SkillOption[] = useMemo(
    () =>
      rawSkills.map((skill) => ({
        id: skill.id,
        title: skill.title,
        image: skill.image,
        type: skill.type,
      })),
    [rawSkills],
  );

  const createItem = api.timelineAdmin.createItem.useMutation();
  const updateItem = api.timelineAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const form = useForm<TimelineFormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      ...initialData,
      roles: initialData.roles ?? [],
      skillIds: initialData.skillIds ?? [],
    } as TimelineFormValues,
    mode: "onBlur",
  });

  const onSubmit = useCallback(
    (values: TimelineFormValues) => {
      startTransition(async () => {
        try {
          const mutationValues = {
            ...values,
            location: values.location ?? undefined,
            startDate: new Date(values.startDate),
            endDate: values.endDate ? new Date(values.endDate) : undefined,
            images: values.images
              .map((entry) => entry.url.trim())
              .filter(Boolean),
            roles: values.roles
              .filter((r) => r.title.trim().length > 0)
              .map((r) => ({
                title: r.title.trim(),
                startDate: r.startDate,
                endDate: r.endDate ?? undefined,
              })),
            skillIds: values.skillIds ?? [],
          };

          if (isEditMode && values.id) {
            await updateItem.mutateAsync({
              ...mutationValues,
              id: values.id,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createItem.mutateAsync(mutationValues);
            toast.success(t("createdSuccess"));
          }

          await utils.timelineAdmin.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [createItem, isEditMode, router, t, updateItem, utils],
  );

  const isSaving = createItem.isPending || updateItem.isPending;
  const anyError = createItem.error ?? updateItem.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent error={anyError}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList variant="line" className="mb-6 w-fit justify-start">
              <TabsTrigger value="general">{t("tabGeneral")}</TabsTrigger>
              <TabsTrigger value="content">{t("tabContent")}</TabsTrigger>
              <TabsTrigger value="roles">{t("tabRoles")}</TabsTrigger>
              <TabsTrigger value="skills">{t("tabSkills")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-0">
              <TimelineGeneralTab form={form} t={t} />
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <TimelineContentTab
                form={form}
                languages={languages}
                activeLangId={activeLangId}
                primaryLangId={primaryLang?.id ?? ""}
                onSelectLang={setActiveLangId}
                showOriginal={showOriginal}
                onToggleShowOriginal={setShowOriginal}
                t={t}
              />
            </TabsContent>

            <TabsContent value="roles" className="mt-0">
              <TimelineRolesTab form={form} t={t} />
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              <TimelineSkillsTab
                form={form}
                availableSkills={availableSkills}
                t={t}
              />
            </TabsContent>
          </Tabs>
        </FormContent>

        <FormActions
          isPending={isPending || isSaving}
          title={isEditMode ? t("save") : t("create")}
          submitId="timeline-form-submit"
        >
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};

// ---------------------------------------------------------------------------
// Standalone Tab Subcomponents
// ---------------------------------------------------------------------------

function TimelineGeneralTab({
  form,
  t,
}: {
  form: UseFormReturn<TimelineFormValues>;
  t: TTranslations;
}) {
  const isCurrent = useWatch({ control: form.control, name: "current" });
  const imageUrls = useWatch({ control: form.control, name: "images" });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: form.control,
    name: "images",
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem
              label={t("organization")}
              inputId="timeline-organization"
              className="sm:col-span-2"
            >
              <Input placeholder={t("organizationPlaceholder")} {...field} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem label={t("category")} inputId="timeline-category">
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCategory")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="WORK">{t("categoryWork")}</SelectItem>
                  <SelectItem value="STUDY">{t("categoryStudy")}</SelectItem>
                  <SelectItem value="COURSE">{t("categoryCourse")}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem label={t("location")} inputId="timeline-location">
              <Input
                placeholder={t("locationPlaceholder")}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem label={t("startDate")} inputId="timeline-start-date">
              <Input type="date" {...field} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem label={t("endDate")} inputId="timeline-end-date">
              <Input
                type="date"
                disabled={isCurrent}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="current"
          render={({ field }) => (
            <div className="border-border bg-card/60 flex items-center justify-between rounded-xl border p-3.5 sm:col-span-2">
              <div className="space-y-0.5">
                <Label
                  htmlFor="timeline-current"
                  className="text-foreground text-sm font-medium"
                >
                  {t("currentEntry")}
                </Label>
              </div>
              <Switch
                id="timeline-current"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    form.setValue("endDate", "");
                  }
                }}
              />
            </div>
          )}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-foreground text-sm font-semibold">
            {t("imagesSection")}
          </h4>
          <p className="text-muted-foreground text-xs">{t("imagesHint")}</p>
        </div>

        <div className="space-y-3">
          {imageFields.map((field, index) => {
            const previewUrl = imageUrls?.[index]?.url?.trim() ?? "";

            return (
              <div
                key={field.id}
                className="border-border bg-card flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start"
              >
                {previewUrl ? (
                  <div className="bg-muted relative h-20 w-full shrink-0 overflow-hidden rounded-md sm:h-20 sm:w-28">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <FormField
                    control={form.control}
                    name={`images.${index}.url`}
                    render={({ field: urlField }) => (
                      <FormItem
                        label={t("imagesLabel")}
                        inputId={`timeline-image-${index}`}
                      >
                        <FormControl>
                          <Input
                            {...urlField}
                            type="url"
                            placeholder={t("imageUrlPlaceholder")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeImage(index)}
                  aria-label={t("removeImage")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendImage({ url: "" })}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            <span>{t("addImage")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function TimelineContentTab({
  form,
  languages,
  activeLangId,
  primaryLangId,
  onSelectLang,
  showOriginal,
  onToggleShowOriginal,
  t,
}: {
  form: UseFormReturn<TimelineFormValues>;
  languages: AppLanguage[];
  activeLangId: string;
  primaryLangId: string;
  onSelectLang: (langId: string) => void;
  showOriginal: boolean;
  onToggleShowOriginal: (show: boolean) => void;
  t: TTranslations;
}) {
  const [startedBlankLanguages, setStartedBlankLanguages] = useState<string[]>(
    [],
  );

  const activeTranslation = form.watch(`translations.${activeLangId}`);
  const activeLang = languages.find((l) => l.id === activeLangId);
  const primaryLang = languages.find((l) => l.id === primaryLangId);
  const isNonPrimary = activeLangId !== primaryLangId;

  const primaryTitle = form.watch(`translations.${primaryLangId}.title`);
  const primaryDesc = form.watch(`translations.${primaryLangId}.description`);

  const hasContent =
    activeLangId === primaryLangId ||
    startedBlankLanguages.includes(activeLangId) ||
    Boolean(
      activeTranslation?.title?.trim() ||
      activeTranslation?.description?.trim(),
    );

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const trans = form.watch(`translations.${lang.id}`);
      const titleOk = Boolean(trans?.title?.trim());
      const descOk = Boolean(trans?.description?.trim());
      const completedCount = [titleOk, descOk].filter(Boolean).length;
      const langHasContent = completedCount > 0;

      return {
        id: lang.id,
        name: lang.name,
        code: lang.code,
        isBase: lang.id === primaryLangId,
        hasContent: langHasContent,
        completedCount,
        totalCount: 2,
      };
    });
  }, [languages, form, primaryLangId]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress) {
    if (!activeTranslation?.title?.trim()) missingItems.push(t("title"));
    if (!activeTranslation?.description?.trim())
      missingItems.push(t("description"));
  }

  const handleCopyFromBase = () => {
    const baseTrans = form.getValues(`translations.${primaryLangId}`);
    if (baseTrans) {
      form.setValue(`translations.${activeLangId}`, {
        title: baseTrans.title ?? "",
        description: baseTrans.description ?? "",
      });
    }
  };

  const handleStartBlank = () => {
    setStartedBlankLanguages((current) => [
      ...new Set([...current, activeLangId]),
    ]);
    form.setValue(`translations.${activeLangId}`, {
      title: "",
      description: "",
    });
  };

  const handleDeleteTranslation = () => {
    setStartedBlankLanguages((current) =>
      current.filter((id) => id !== activeLangId),
    );
    form.setValue(`translations.${activeLangId}`, {
      title: "",
      description: "",
    });
  };

  return (
    <div className="space-y-6">
      <AdminFormLanguageBar
        languages={languageProgressList}
        activeLangId={activeLangId}
        onSelectLang={onSelectLang}
        missingItems={missingItems}
        isNonPrimary={isNonPrimary}
        showOriginal={showOriginal}
        onToggleShowOriginal={onToggleShowOriginal}
        baseLabel={t("baseLanguageLabel")}
        completeProgressText={(ok, total) =>
          t("completeProgress", { completed: ok, total })
        }
        notTranslatedText={(name) => t("notTranslated", { language: name })}
        allCompleteText={t("allComplete")}
        missingFieldsText={(fields) => t("missingFields", { fields })}
        showOriginalText={t("showOriginal")}
      />

      {!hasContent ? (
        <AdminFormEmptyTranslation
          languageName={activeLang?.name ?? ""}
          baseLanguageName={primaryLang?.name ?? primaryLang?.code ?? ""}
          onCopyFromBase={handleCopyFromBase}
          onStartBlank={handleStartBlank}
          notTranslatedTitle={t("notTranslated", {
            language: activeLang?.name ?? "",
          })}
          notTranslatedHint={t("notTranslatedHint", {
            baseLanguage: primaryLang?.name ?? primaryLang?.code ?? "",
          })}
          copyFromBaseText={t("copyFromBase", {
            baseLanguage: primaryLang?.name ?? primaryLang?.code ?? "",
          })}
          startBlankText={t("startBlank")}
        />
      ) : (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name={`translations.${activeLangId}.title`}
            render={({ field }) => (
              <div>
                {showOriginal && isNonPrimary && primaryTitle && (
                  <ReferenceSnippet
                    label={primaryLang?.code.toUpperCase() ?? ""}
                    content={primaryTitle}
                    onCopy={() => field.onChange(primaryTitle)}
                    copyText={t("copy")}
                  />
                )}
                <FormItem
                  label={t("title")}
                  inputId={`timeline-title-${activeLangId}`}
                >
                  <Input placeholder={t("titlePlaceholder")} {...field} />
                </FormItem>
              </div>
            )}
          />

          <FormField
            control={form.control}
            name={`translations.${activeLangId}.description`}
            render={({ field }) => (
              <div>
                {showOriginal && isNonPrimary && primaryDesc && (
                  <ReferenceSnippet
                    label={primaryLang?.code.toUpperCase() ?? ""}
                    content={primaryDesc}
                    onCopy={() => field.onChange(primaryDesc)}
                    copyText={t("copy")}
                  />
                )}
                <FormItem
                  label={t("description")}
                  inputId={`timeline-description-${activeLangId}`}
                >
                  <Textarea
                    rows={4}
                    placeholder={t("descriptionPlaceholder")}
                    {...field}
                  />
                </FormItem>
              </div>
            )}
          />

          {isNonPrimary && (
            <AdminFormDeleteTranslation
              languageName={activeLang?.name ?? ""}
              onDelete={handleDeleteTranslation}
              buttonText={t("deleteTranslation", {
                language: activeLang?.name ?? "",
              })}
              confirmQuestion={t("deleteTranslationConfirm", {
                language: activeLang?.name ?? "",
              })}
              confirmDeleteText={t("delete")}
              cancelText={t("cancel")}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TimelineRolesTab({
  form,
  t,
}: {
  form: UseFormReturn<TimelineFormValues>;
  t: TTranslations;
}) {
  const {
    fields: roleFields,
    append: appendRole,
    remove: removeRole,
    swap: swapRoles,
  } = useFieldArray({
    control: form.control,
    name: "roles",
  });

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-foreground text-sm font-semibold">
          {t("tabRoles")}
        </h4>
        <p className="text-muted-foreground text-xs">{t("rolesHint")}</p>
      </div>

      {roleFields.length === 0 ? (
        <div className="border-border/80 rounded-xl border border-dashed p-6 text-center">
          <p className="text-muted-foreground text-xs">{t("noRoles")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {roleFields.map((field, index) => (
            <li
              key={field.id}
              className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start"
            >
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name={`roles.${index}.title`}
                  render={({ field: titleField }) => (
                    <FormItem
                      label={t("roleTitle")}
                      inputId={`role-title-${index}`}
                      className="sm:col-span-3"
                    >
                      <Input
                        placeholder={t("roleTitlePlaceholder")}
                        {...titleField}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`roles.${index}.startDate`}
                  render={({ field: startField }) => (
                    <FormItem
                      label={t("roleStartDate")}
                      inputId={`role-start-${index}`}
                    >
                      <Input type="month" {...startField} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`roles.${index}.endDate`}
                  render={({ field: endField }) => (
                    <FormItem
                      label={t("roleEndDate")}
                      inputId={`role-end-${index}`}
                    >
                      <Input
                        type="month"
                        value={endField.value ?? ""}
                        onChange={endField.onChange}
                        onBlur={endField.onBlur}
                      />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex shrink-0 items-center justify-end gap-1 pt-1 sm:flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={index === 0}
                  onClick={() => swapRoles(index, index - 1)}
                  aria-label="Move role up"
                >
                  <ChevronUp className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={index === roleFields.length - 1}
                  onClick={() => swapRoles(index, index + 1)}
                  aria-label="Move role down"
                >
                  <ChevronDown className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive size-8"
                  onClick={() => removeRole(index)}
                  aria-label="Delete role"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => appendRole({ title: "", startDate: "", endDate: "" })}
        className="gap-1.5"
      >
        <Plus className="size-4" />
        <span>{t("addRole")}</span>
      </Button>
    </div>
  );
}

function TimelineSkillsTab({
  form,
  availableSkills,
  t,
}: {
  form: UseFormReturn<TimelineFormValues>;
  availableSkills: SkillOption[];
  t: TTranslations;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-foreground text-sm font-semibold">
          {t("tabSkills")}
        </h4>
        <p className="text-muted-foreground text-xs">{t("skillsHint")}</p>
      </div>

      <FormField
        control={form.control}
        name="skillIds"
        render={({ field }) => (
          <SkillPicker
            availableSkills={availableSkills}
            selectedSkillIds={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </div>
  );
}
