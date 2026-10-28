"use client";

import { type FC, useTransition, useMemo, useCallback, useState } from "react";
import type { AppLanguage } from "@prisma/client";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Award, Eye } from "lucide-react";

import { api } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { SkillPicker } from "@/components/admin/skill-picker";
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
  type CertificationEditorDTO,
  type CertificationCreateFormDTO,
} from "@/features/certifications/lib/certification-editor-dto";
import { StackTypeSchema } from "@/features/portfolio/server/portfolio-admin-shared";
import { cn } from "@/lib/utils";

interface CertificationFormProps {
  languages: AppLanguage[];
  initialData: CertificationEditorDTO | CertificationCreateFormDTO;
}

type TTranslations = ReturnType<
  typeof useTranslations<"admin.forms.certification">
>;

function createCertificationFormSchema(
  t: TTranslations,
  primaryLangId: string | undefined,
) {
  return z.object({
    id: z.string().optional(),
    company: z.string().min(1, t("companyRequired")),
    issuedDate: z.number().int().optional().nullable(),
    url: z.string().url().optional().or(z.literal("")),
    idCredential: z.string().optional().or(z.literal("")),
    image: z.string().optional().or(z.literal("")),
    type: z.array(StackTypeSchema),
    skillIds: z.array(z.string()),
    translations: z
      .record(
        z.string(),
        z.object({
          title: z.string(),
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

type CertificationFormValues = z.infer<
  ReturnType<typeof createCertificationFormSchema>
>;

export const CertificationForm: FC<CertificationFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.certification");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("general");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const [activeLangId, setActiveLangId] = useState<string>(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );
  const [showOriginal, setShowOriginal] = useState(true);

  const formSchema = useMemo(
    () => createCertificationFormSchema(t, primaryLang?.id),
    [primaryLang?.id, t],
  );

  const defaultValues = useMemo<CertificationFormValues>(() => {
    const rawTranslations = (initialData.translations ?? {}) as Record<
      string,
      { title?: string }
    >;
    const normalizedTranslations: Record<string, { title: string }> = {};

    for (const lang of languages) {
      const existing = rawTranslations[lang.id];
      normalizedTranslations[lang.id] = {
        title: existing?.title ?? "",
      };
    }

    return {
      id: "id" in initialData ? initialData.id : undefined,
      company: initialData.company ?? "",
      issuedDate: initialData.issuedDate ?? null,
      url: initialData.url ?? "",
      idCredential: initialData.idCredential ?? "",
      image: initialData.image ?? "",
      type: initialData.type ?? [],
      skillIds: initialData.skillIds ?? [],
      translations: normalizedTranslations,
    };
  }, [initialData, languages]);

  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  const createCert = api.certificationsAdmin.createItem.useMutation();
  const updateCert = api.certificationsAdmin.updateItem.useMutation();
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
  const watchedTypes = useWatch({
    control: form.control,
    name: "type",
  });
  const watchedImage = useWatch({
    control: form.control,
    name: "image",
  });

  const languageProgress = useMemo<LanguageProgress[]>(() => {
    return languages.map((lang) => {
      const tr = watchedTranslations?.[lang.id];
      const isBase = lang.id === primaryLang?.id;
      const hasTitle = Boolean(tr?.title && tr.title.trim().length > 0);
      const completedCount = hasTitle ? 1 : 0;
      const totalCount = 1;
      const hasContent = hasTitle;

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
    !currentTranslation?.title?.trim();

  const primaryTranslation = primaryLang?.id
    ? watchedTranslations?.[primaryLang.id]
    : undefined;

  const primaryTitle = primaryTranslation?.title ?? "";

  const handleCopyFromBase = useCallback(
    (langId: string) => {
      if (!primaryTranslation) return;
      form.setValue(`translations.${langId}`, {
        title: primaryTranslation.title ?? "",
      });
    },
    [form, primaryTranslation],
  );

  const handleStartBlank = useCallback(
    (langId: string) => {
      setBlankLanguages((current) => [...current, langId]);
      form.setValue(`translations.${langId}`, {
        title: "",
      });
    },
    [form],
  );

  const handleDeleteTranslation = useCallback(
    (langId: string) => {
      setBlankLanguages((current) => current.filter((id) => id !== langId));
      form.setValue(`translations.${langId}`, {
        title: "",
      });
      toast.success(t("delete"));
    },
    [form, t],
  );

  const toggleType = useCallback(
    (typeOption: z.infer<typeof StackTypeSchema>) => {
      const current = form.getValues("type") ?? [];
      if (current.includes(typeOption)) {
        form.setValue(
          "type",
          current.filter((t) => t !== typeOption),
          { shouldDirty: true },
        );
      } else {
        form.setValue("type", [...current, typeOption], { shouldDirty: true });
      }
    },
    [form],
  );

  const onSubmit = useCallback(
    (values: CertificationFormValues) => {
      startTransition(async () => {
        try {
          const data = {
            ...values,
            issuedDate: values.issuedDate ?? undefined,
            url: values.url ?? undefined,
            idCredential: values.idCredential ?? undefined,
            image: values.image ?? undefined,
          };

          if (isEditMode && values.id) {
            await updateCert.mutateAsync({
              id: values.id,
              ...data,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createCert.mutateAsync(data);
            toast.success(t("createdSuccess"));
          }

          await utils.certificationsAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateCert, createCert, utils, router, t],
  );

  const isSaving = isPending || createCert.isPending || updateCert.isPending;
  const anyError = createCert.error ?? updateCert.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent error={anyError}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 w-full flex-1 flex-col"
          >
            <TabsList variant="line" className="mb-6 w-fit justify-start">
              <TabsTrigger value="general">{t("tabGeneral")}</TabsTrigger>
              <TabsTrigger value="content">{t("tabContent")}</TabsTrigger>
              <TabsTrigger value="skills">{t("tabSkills")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem
                      label={t("issuingCompany")}
                      inputId="certification-issuing-company"
                    >
                      <Input
                        placeholder={t("issuingCompanyPlaceholder")}
                        {...field}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issuedDate"
                  render={({ field }) => (
                    <FormItem
                      label={t("issuedDate")}
                      inputId="certification-issued-date"
                    >
                      <Input
                        type="number"
                        placeholder={t("issuedDatePlaceholder")}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
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
                  name="url"
                  render={({ field }) => (
                    <FormItem
                      label={t("credentialUrl")}
                      inputId="certification-credential-url"
                    >
                      <Input
                        placeholder={t("credentialUrlPlaceholder")}
                        {...field}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idCredential"
                  render={({ field }) => (
                    <FormItem
                      label={t("credentialId")}
                      inputId="certification-credential-id"
                    >
                      <Input
                        placeholder={t("credentialIdPlaceholder")}
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem
                      label={t("imageUrl")}
                      inputId="certification-image"
                    >
                      <Input
                        placeholder={t("imageUrlPlaceholder")}
                        {...field}
                      />
                    </FormItem>
                  )}
                />
                {watchedImage ? (
                  <div className="border-border bg-muted/30 flex items-center gap-4 rounded-xl border p-3">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="group border-border bg-card hover:border-primary/60 relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-all"
                      title="Click to expand"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={watchedImage}
                        alt="Certificate Preview"
                        className="size-full object-contain p-1 transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye className="size-4 text-white" />
                      </div>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-xs font-semibold">
                        {t("previewTitle") || "Vista previa del certificado"}
                      </p>
                      <p className="text-muted-foreground truncate font-mono text-xs">
                        {watchedImage}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="text-primary mt-1 inline-flex cursor-pointer items-center gap-1 text-xs hover:underline"
                      >
                        <Eye className="size-3" />
                        <span>
                          {t("viewFullImage") || "Ver imagen completa"}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <span className="text-foreground text-sm font-medium">
                  {t("relatedTypes")}
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {StackTypeSchema.options.map((opt) => {
                    const isSelected = watchedTypes?.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        role="checkbox"
                        aria-checked={Boolean(isSelected)}
                        onClick={() => toggleType(opt)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
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
                          inputId={`certification-title-${activeLangId}`}
                        >
                          <Input
                            placeholder={t("titlePlaceholder")}
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

            <TabsContent
              value="skills"
              className="mt-0 flex min-h-0 flex-1 flex-col space-y-4"
            >
              <FormField
                control={form.control}
                name="skillIds"
                render={({ field }) => (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <SkillPicker
                      selectedSkillIds={field.value ?? []}
                      onChange={field.onChange}
                      availableSkills={availableSkills}
                    />
                  </div>
                )}
              />
            </TabsContent>
          </Tabs>
        </FormContent>

        <FormActions
          isPending={isSaving}
          title={isEditMode ? t("save") : t("create")}
          submitId="certification-form-submit"
        >
          <Button
            id="certification-form-cancel"
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>

      <ImageLightbox
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        src={watchedImage ?? ""}
        alt="Certificate Preview"
        title={
          <div className="flex items-center gap-2">
            <Award className="text-primary size-5" />
            <span className="font-semibold">
              {form.getValues(`translations.${activeLangId}.title`) ??
                t("previewTitle")}
            </span>
          </div>
        }
        subtitle={
          form.getValues("company") ? (
            <span className="text-muted-foreground text-xs">
              {form.getValues("company")}
            </span>
          ) : undefined
        }
      />
    </Form>
  );
};
