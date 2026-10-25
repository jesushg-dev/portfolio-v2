"use client";

import { type FC, useTransition, useMemo, useCallback, useState } from "react";
import type { AppLanguage } from "@prisma/client";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillPicker } from "@/components/admin/skill-picker";
import { UniversalIconPicker } from "@/components/shared/universal-icon-picker";
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
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import {
  type ServiceCreateFormDTO,
  type ServiceEditorDTO,
} from "@/features/services/lib/service-editor-dto";
import { StackTypeSchema } from "@/features/portfolio/server/portfolio-admin-shared";

interface ServiceFormProps {
  languages: AppLanguage[];
  initialData: ServiceEditorDTO | ServiceCreateFormDTO;
}

type TTranslations = ReturnType<typeof useTranslations<"admin.forms.service">>;

function createServiceFormSchema(
  t: TTranslations,
  primaryLangId: string | undefined,
) {
  return z.object({
    id: z.string().optional(),
    image: z.string(),
    type: StackTypeSchema,
    icon: z.string(),
    statsValue: z.string(),
    featured: z.boolean(),
    isActive: z.boolean(),
    order: z.number(),
    skillIds: z.array(z.string()),
    translations: z
      .record(
        z.string(),
        z.object({
          title: z.string(),
          description: z.string(),
          badge: z.string(),
          statsLabel: z.string(),
        }),
      )
      .refine(
        (val) => {
          if (!primaryLangId) return true;
          return Boolean(val[primaryLangId]?.title?.trim());
        },
        {
          message: t("titleRequiredPrimary"),
          path: [primaryLangId ?? "", "title"],
        },
      ),
  });
}

type ServiceFormValues = z.infer<ReturnType<typeof createServiceFormSchema>>;

export const ServiceForm: FC<ServiceFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.service");
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
    () => createServiceFormSchema(t, primaryLang?.id),
    [primaryLang?.id, t],
  );

  const defaultValues = useMemo<ServiceFormValues>(() => {
    const rawTranslations = (initialData.translations ?? {}) as Record<
      string,
      {
        title?: string;
        description?: string;
        badge?: string;
        statsLabel?: string;
      }
    >;
    const normalizedTranslations: Record<
      string,
      { title: string; description: string; badge: string; statsLabel: string }
    > = {};

    for (const lang of languages) {
      const existing = rawTranslations[lang.id];
      normalizedTranslations[lang.id] = {
        title: existing?.title ?? "",
        description: existing?.description ?? "",
        badge: existing?.badge ?? "",
        statsLabel: existing?.statsLabel ?? "",
      };
    }

    return {
      id: "id" in initialData ? initialData.id : undefined,
      image: initialData.image ?? "",
      type: initialData.type ?? "FRONTEND",
      icon: initialData.icon ?? "code",
      statsValue: initialData.statsValue ?? "",
      featured: initialData.featured ?? false,
      isActive: initialData.isActive ?? true,
      order: initialData.order ?? 0,
      skillIds: initialData.skillIds ?? [],
      translations: normalizedTranslations,
    };
  }, [initialData, languages]);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  const createService = api.servicesAdmin.createItem.useMutation();
  const updateService = api.servicesAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const { data: { data: rawSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});

  const availableSkills = useMemo(
    () =>
      rawSkills.map((s) => ({
        id: s.id,
        title: s.title,
        image: s.image,
        type: s.type,
      })),
    [rawSkills],
  );

  const watchedTranslations = useWatch({
    control: form.control,
    name: "translations",
  });

  const languageProgress = useMemo<LanguageProgress[]>(() => {
    return languages.map((lang) => {
      const tr = watchedTranslations?.[lang.id];
      const isBase = lang.id === primaryLang?.id;
      const hasTitle = Boolean(tr?.title && tr.title.trim().length > 0);
      const hasDesc = Boolean(
        tr?.description && tr.description.trim().length > 0,
      );
      const completedCount = (hasTitle ? 1 : 0) + (hasDesc ? 1 : 0);
      const totalCount = 2;
      const hasContent = hasTitle || hasDesc;

      return {
        id: lang.id,
        name: lang.name,
        code: lang.code,
        isBase,
        hasContent,
        completedCount,
        totalCount,
      };
    });
  }, [languages, primaryLang?.id, watchedTranslations]);

  const activeLang = useMemo(
    () => languages.find((l) => l.id === activeLangId),
    [languages, activeLangId],
  );
  const isNonPrimary = activeLangId !== primaryLang?.id;

  const currentTranslation = watchedTranslations?.[activeLangId];
  const isCurrentTranslationEmpty =
    !currentTranslation ||
    (!currentTranslation.title?.trim() &&
      !currentTranslation.description?.trim());

  const primaryTranslation = primaryLang?.id
    ? watchedTranslations?.[primaryLang.id]
    : undefined;

  const primaryTitle = primaryTranslation?.title ?? "";
  const primaryDesc = primaryTranslation?.description ?? "";

  const handleCopyFromBase = useCallback(
    (langId: string) => {
      if (!primaryTranslation) return;
      form.setValue(`translations.${langId}`, {
        title: primaryTranslation.title ?? "",
        description: primaryTranslation.description ?? "",
        badge: primaryTranslation.badge ?? "",
        statsLabel: primaryTranslation.statsLabel ?? "",
      });
    },
    [form, primaryTranslation],
  );

  const handleStartBlank = useCallback(
    (langId: string) => {
      form.setValue(`translations.${langId}`, {
        title: "",
        description: "",
        badge: "",
        statsLabel: "",
      });
    },
    [form],
  );

  const handleDeleteTranslation = useCallback(
    (langId: string) => {
      form.setValue(`translations.${langId}`, {
        title: "",
        description: "",
        badge: "",
        statsLabel: "",
      });
      toast.success(t("delete"));
    },
    [form, t],
  );

  const onSubmit = useCallback(
    (values: ServiceFormValues) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateService.mutateAsync({
              id: values.id,
              ...values,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createService.mutateAsync(values);
            toast.success(t("createdSuccess"));
          }

          await utils.servicesAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateService, createService, utils, router, t],
  );

  const isSaving =
    isPending || createService.isPending || updateService.isPending;
  const anyError = createService.error ?? updateService.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent error={anyError}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList
              variant="line"
              className="mb-6 w-full justify-start border-b"
            >
              <TabsTrigger value="general">{t("tabGeneral")}</TabsTrigger>
              <TabsTrigger value="content">{t("tabContent")}</TabsTrigger>
              <TabsTrigger value="skills">{t("tabSkills")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem label={t("icon")} inputId="service-icon">
                      <UniversalIconPicker
                        value={field.value}
                        onChange={field.onChange}
                        preset="service"
                        triggerId="service-icon"
                        showPreview
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem label={t("type")} inputId="service-type">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger id="service-type">
                            <SelectValue placeholder={t("selectType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {StackTypeSchema.options.map((opt) => (
                            <SelectItem
                              key={opt}
                              value={opt}
                              id={`service-type-option-${opt}`}
                            >
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="statsValue"
                  render={({ field }) => (
                    <FormItem
                      label={t("statsValue")}
                      inputId="service-stats-value"
                    >
                      <Input
                        placeholder={t("statsValuePlaceholder")}
                        {...field}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem label={t("image")} inputId="service-image">
                      <Input placeholder={t("imagePlaceholder")} {...field} />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem
                      label={t("isActive")}
                      description={t("isActiveHint")}
                      inputId="service-active"
                    >
                      <div className="flex h-10 items-center">
                        <Switch
                          id="service-active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem
                      label={t("featuredLabel")}
                      description={t("featuredDescription")}
                      inputId="service-featured"
                    >
                      <div className="flex h-10 items-center">
                        <Switch
                          id="service-featured"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <AdminFormLanguageBar
                languages={languageProgress}
                activeLangId={activeLangId}
                onSelectLang={setActiveLangId}
                showOriginal={showOriginal}
                onToggleShowOriginal={() => setShowOriginal(!showOriginal)}
                baseLabel={t("baseLanguageLabel")}
                allCompleteText={t("allComplete")}
                showOriginalText={t("showOriginal")}
              />

              {isNonPrimary && isCurrentTranslationEmpty ? (
                <AdminFormEmptyTranslation
                  languageName={activeLang?.name ?? activeLang?.code ?? ""}
                  baseLanguageName={
                    primaryLang?.name ?? primaryLang?.code ?? ""
                  }
                  onCopyFromBase={() => handleCopyFromBase(activeLangId)}
                  onStartBlank={() => handleStartBlank(activeLangId)}
                  notTranslatedText={t("notTranslated", {
                    language: activeLang?.name ?? activeLang?.code ?? "",
                  })}
                  notTranslatedHintText={t("notTranslatedHint", {
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
                          inputId={`service-title-${activeLangId}`}
                        >
                          <Input
                            placeholder={t("titlePlaceholder")}
                            {...field}
                          />
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
                          inputId={`service-description-${activeLangId}`}
                        >
                          <Textarea
                            rows={3}
                            placeholder={t("descriptionPlaceholder")}
                            {...field}
                          />
                        </FormItem>
                      </div>
                    )}
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`translations.${activeLangId}.badge`}
                      render={({ field }) => (
                        <FormItem
                          label={t("badge")}
                          inputId={`service-badge-${activeLangId}`}
                        >
                          <Input
                            placeholder={t("badgePlaceholder")}
                            {...field}
                          />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`translations.${activeLangId}.statsLabel`}
                      render={({ field }) => (
                        <FormItem
                          label={t("statsLabel")}
                          inputId={`service-stats-label-${activeLangId}`}
                        >
                          <Input
                            placeholder={t("statsLabelPlaceholder")}
                            {...field}
                          />
                        </FormItem>
                      )}
                    />
                  </div>

                  {isNonPrimary && !isCurrentTranslationEmpty && (
                    <AdminFormDeleteTranslation
                      languageName={activeLang?.name ?? activeLang?.code ?? ""}
                      deleteTranslationText={t("deleteTranslation", {
                        language: activeLang?.name ?? activeLang?.code ?? "",
                      })}
                      deleteConfirmText={t("deleteTranslationConfirm", {
                        language: activeLang?.name ?? activeLang?.code ?? "",
                      })}
                      onDelete={() => handleDeleteTranslation(activeLangId)}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-6">
              <FormField
                control={form.control}
                name="skillIds"
                render={({ field }) => (
                  <SkillPicker
                    selectedSkillIds={field.value ?? []}
                    onChange={field.onChange}
                    availableSkills={availableSkills}
                  />
                )}
              />
            </TabsContent>
          </Tabs>
        </FormContent>

        <FormActions
          isPending={isSaving}
          title={isEditMode ? t("save") : t("create")}
          submitId="service-form-submit"
        >
          <Button
            id="service-form-cancel"
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
