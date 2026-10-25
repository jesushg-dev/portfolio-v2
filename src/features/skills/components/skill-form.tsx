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
import { Form, FormControl, FormField } from "@/components/ui/form";
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
import SkillIcon from "@/features/home/components/skills/skill-icon";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import {
  type SkillCreateFormDTO,
  type SkillEditorDTO,
} from "@/features/skills/lib/skill-editor-dto";
import { StackTypeSchema } from "@/features/portfolio/server/portfolio-admin-shared";
import { isAbsoluteOrLocalImagePath } from "@/utils/tools/image";

interface SkillFormProps {
  languages: AppLanguage[];
  initialData: SkillEditorDTO | SkillCreateFormDTO;
}

type TTranslations = ReturnType<
  typeof useTranslations<"admin.forms.portfolioSkill">
>;

function createSkillFormSchema(t: TTranslations) {
  return z.object({
    id: z.string().optional(),
    title: z.string().min(1, t("titleRequired")),
    image: z
      .string()
      .min(1, t("imageRequired"))
      .refine(isAbsoluteOrLocalImagePath, t("imageUrlInvalid")),
    type: StackTypeSchema,
    featured: z.boolean(),
    translations: z.record(
      z.string(),
      z.object({
        description: z.string(),
        urlWiki: z.string().optional(),
      }),
    ),
  });
}

type SkillFormValues = z.infer<ReturnType<typeof createSkillFormSchema>>;

export const SkillForm: FC<SkillFormProps> = ({ initialData, languages }) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.portfolioSkill");
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

  const formSchema = useMemo(() => createSkillFormSchema(t), [t]);

  const defaultValues = useMemo<SkillFormValues>(() => {
    const rawTranslations = (initialData.translations ?? {}) as Record<
      string,
      { description?: string; urlWiki?: string }
    >;
    const normalizedTranslations: Record<
      string,
      { description: string; urlWiki: string }
    > = {};

    for (const lang of languages) {
      const existing = rawTranslations[lang.id];
      normalizedTranslations[lang.id] = {
        description: existing?.description ?? "",
        urlWiki: existing?.urlWiki ?? "",
      };
    }

    return {
      id: "id" in initialData ? initialData.id : undefined,
      title: initialData.title ?? "",
      image: initialData.image ?? "",
      type: initialData.type ?? "FRONTEND",
      featured: initialData.featured ?? false,
      translations: normalizedTranslations,
    };
  }, [initialData, languages]);

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  const createSkill = api.skillsAdmin.createItem.useMutation();
  const updateSkill = api.skillsAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const watchedTranslations = useWatch({
    control: form.control,
    name: "translations",
  });
  const watchedTitle = useWatch({
    control: form.control,
    name: "title",
  });
  const watchedImage = useWatch({
    control: form.control,
    name: "image",
  });

  const languageProgress = useMemo<LanguageProgress[]>(() => {
    return languages.map((lang) => {
      const tr = watchedTranslations?.[lang.id];
      const isBase = lang.id === primaryLang?.id;
      const hasDesc = Boolean(
        tr?.description && tr.description.trim().length > 0,
      );
      const hasWiki = Boolean(tr?.urlWiki && tr.urlWiki.trim().length > 0);
      const completedCount = (hasDesc ? 1 : 0) + (hasWiki ? 1 : 0);
      const totalCount = 2;
      const hasContent = hasDesc || hasWiki;

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
    (!currentTranslation.description?.trim() &&
      !currentTranslation.urlWiki?.trim());

  const primaryTranslation = primaryLang?.id
    ? watchedTranslations?.[primaryLang.id]
    : undefined;

  const primaryDesc = primaryTranslation?.description ?? "";
  const primaryWiki = primaryTranslation?.urlWiki ?? "";

  const handleCopyFromBase = useCallback(
    (langId: string) => {
      if (!primaryTranslation) return;
      form.setValue(`translations.${langId}`, {
        description: primaryTranslation.description ?? "",
        urlWiki: primaryTranslation.urlWiki ?? "",
      });
    },
    [form, primaryTranslation],
  );

  const handleStartBlank = useCallback(
    (langId: string) => {
      form.setValue(`translations.${langId}`, {
        description: "",
        urlWiki: "",
      });
    },
    [form],
  );

  const handleDeleteTranslation = useCallback(
    (langId: string) => {
      form.setValue(`translations.${langId}`, {
        description: "",
        urlWiki: "",
      });
      toast.success(t("delete"));
    },
    [form, t],
  );

  const onSubmit = useCallback(
    (values: SkillFormValues) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateSkill.mutateAsync({
              id: values.id,
              ...values,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createSkill.mutateAsync(values);
            toast.success(t("createdSuccess"));
          }

          await utils.skillsAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateSkill, createSkill, utils, router, t],
  );

  const isSaving = isPending || createSkill.isPending || updateSkill.isPending;
  const anyError = createSkill.error ?? updateSkill.error;

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
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="border-border bg-card/60 flex items-center gap-4 rounded-xl border p-4">
                <SkillIcon
                  image={watchedImage}
                  title={watchedTitle || "Skill Preview"}
                  tile
                  size="lg"
                />
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-semibold">
                    {watchedTitle || t("titlePlaceholder")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {form.getValues("type")}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem label={t("title")} inputId="skill-title">
                      <Input placeholder={t("titlePlaceholder")} {...field} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem label={t("type")} inputId="skill-type">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger id="skill-type">
                            <SelectValue placeholder={t("selectType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {StackTypeSchema.options.map((opt) => (
                            <SelectItem
                              key={opt}
                              value={opt}
                              id={`skill-type-option-${opt}`}
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

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem label={t("imageUrl")} inputId="skill-image">
                    <Input placeholder={t("imageUrlPlaceholder")} {...field} />
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
                    inputId="skill-featured"
                  >
                    <div className="flex h-10 items-center">
                      <Switch
                        id="skill-featured"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </FormItem>
                )}
              />
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
                          inputId={`skill-desc-${activeLangId}`}
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

                  <FormField
                    control={form.control}
                    name={`translations.${activeLangId}.urlWiki`}
                    render={({ field }) => (
                      <div>
                        {showOriginal && isNonPrimary && primaryWiki && (
                          <ReferenceSnippet
                            label={primaryLang?.code.toUpperCase() ?? ""}
                            content={primaryWiki}
                            onCopy={() => field.onChange(primaryWiki)}
                            copyText={t("copy")}
                          />
                        )}
                        <FormItem
                          label={t("wikiUrl")}
                          inputId={`skill-wiki-${activeLangId}`}
                        >
                          <Input
                            placeholder={t("wikiUrlPlaceholder")}
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
          submitId="skill-form-submit"
        >
          <Button
            id="skill-form-cancel"
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
