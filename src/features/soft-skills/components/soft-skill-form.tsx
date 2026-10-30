"use client";

import { type FC, useMemo, useCallback, useTransition, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  type SoftSkillCreateFormDTO,
  type SoftSkillEditorDTO,
} from "@/features/soft-skills/lib/soft-skill-editor-dto";
import { api } from "@/trpc/react";
import type { AppLanguage } from "@prisma/client";

interface SoftSkillFormProps {
  languages: AppLanguage[];
  initialData: SoftSkillEditorDTO | SoftSkillCreateFormDTO;
}

type TTranslations = ReturnType<
  typeof useTranslations<"admin.forms.portfolioSoftSkill">
>;

function createSoftSkillFormSchema(
  t: TTranslations,
  primaryLangId: string | undefined,
) {
  return z.object({
    id: z.string().optional(),
    icon: z.string().min(1, t("iconRequired")),
    isVisible: z.boolean(),
    featured: z.boolean(),
    order: z.number().int().nonnegative(),
    translations: z
      .record(
        z.string(),
        z.object({
          title: z.string(),
          description: z.string(),
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

type FormValues = z.infer<ReturnType<typeof createSoftSkillFormSchema>>;

export const SoftSkillForm: FC<SoftSkillFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.portfolioSoftSkill");
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
    () => createSoftSkillFormSchema(t, primaryLang?.id),
    [primaryLang?.id, t],
  );

  const defaultValues = useMemo<FormValues>(() => {
    const rawTranslations = (initialData.translations ?? {}) as Record<
      string,
      { title?: string; description?: string }
    >;
    const normalizedTranslations: Record<
      string,
      { title: string; description: string }
    > = {};

    for (const lang of languages) {
      const existing = rawTranslations[lang.id];
      normalizedTranslations[lang.id] = {
        title: existing?.title ?? "",
        description: existing?.description ?? "",
      };
    }

    return {
      id: "id" in initialData ? initialData.id : undefined,
      icon: initialData.icon ?? "star",
      isVisible: initialData.isVisible ?? true,
      featured: initialData.featured ?? false,
      order: initialData.order ?? 0,
      translations: normalizedTranslations,
    };
  }, [initialData, languages]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  const createItem = api.softSkillsAdmin.createItem.useMutation();
  const updateItem = api.softSkillsAdmin.updateItem.useMutation();
  const utils = api.useUtils();

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

  const [blankLanguages, setBlankLanguages] = useState<string[]>([]);

  const currentTranslation = watchedTranslations?.[activeLangId];
  const isCurrentTranslationEmpty =
    !blankLanguages.includes(activeLangId) &&
    (!currentTranslation ||
      (!currentTranslation.title?.trim() &&
        !currentTranslation.description?.trim()));

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
      });
    },
    [form, primaryTranslation],
  );

  const handleStartBlank = useCallback(
    (langId: string) => {
      setBlankLanguages((current) => [...current, langId]);
      form.setValue(`translations.${langId}`, {
        title: "",
        description: "",
      });
    },
    [form],
  );

  const handleDeleteTranslation = useCallback(
    (langId: string) => {
      setBlankLanguages((current) => current.filter((id) => id !== langId));
      form.setValue(`translations.${langId}`, {
        title: "",
        description: "",
      });
      toast.success(t("delete"));
    },
    [form, t],
  );

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateItem.mutateAsync({
              id: values.id,
              ...values,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createItem.mutateAsync(values);
            toast.success(t("createdSuccess"));
          }

          await utils.softSkillsAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateItem, createItem, utils, router, t],
  );

  const isSaving = isPending || createItem.isPending || updateItem.isPending;
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
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem
                      label={t("icon")}
                      description={t("iconHint")}
                      inputId="soft-skill-icon"
                    >
                      <UniversalIconPicker
                        value={field.value}
                        onChange={field.onChange}
                        preset="soft-skill"
                        triggerId="soft-skill-icon"
                        showPreview
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem
                      label={t("displayOrder")}
                      inputId="soft-skill-order"
                    >
                      <Input
                        type="number"
                        value={field.value ?? 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? 0 : Number(e.target.value),
                          )
                        }
                      />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem
                      label={t("visibleLabel")}
                      description={t("visibleDescription")}
                      inputId="soft-skill-visible"
                    >
                      <div className="flex h-10 items-center">
                        <Switch
                          id="soft-skill-visible"
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
                      inputId="soft-skill-featured"
                    >
                      <div className="flex h-10 items-center">
                        <Switch
                          id="soft-skill-featured"
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
                          inputId={`soft-skill-title-${activeLangId}`}
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
                          inputId={`soft-skill-description-${activeLangId}`}
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
          </Tabs>
        </FormContent>

        <FormActions
          isPending={isSaving}
          title={isEditMode ? t("save") : t("create")}
          submitId="soft-skill-form-submit"
        >
          <Button
            id="soft-skill-form-cancel"
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
