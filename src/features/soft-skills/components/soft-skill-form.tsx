"use client";

import { type FC, useMemo, useCallback, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import {
  resolvePrimaryLanguage,
  titleDescriptionTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import {
  SOFT_SKILL_ICON_KEYS,
  resolveSoftSkillIcon,
} from "@/features/soft-skills/lib/soft-skill-icons";
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

export const SoftSkillForm: FC<SoftSkillFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.portfolioSoftSkill");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        icon: z.string().min(1, t("iconRequired")),
        isVisible: z.boolean(),
        featured: z.boolean(),
        order: z.number().int().nonnegative(),
        translations: titleDescriptionTranslationMapSchema(
          primaryLang?.id,
          t("titleRequiredPrimary"),
        ),
      }),
    [primaryLang?.id, t],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData as FormValues,
    mode: "onBlur",
  });

  const {
    activeLangId,
    setActiveLangId,
    statusByLangId,
    copyFieldsFromPrimary,
    isFormLoading,
  } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData as FormValues,
    resourceId: "id" in initialData ? initialData.id : undefined,
    completenessFields: ["title", "description"],
    copyFields: ["title", "description"],
  });

  const selectedIcon = useWatch({ control: form.control, name: "icon" });
  const SelectedIcon = resolveSoftSkillIcon(selectedIcon);

  const createItem = api.softSkillsAdmin.createItem.useMutation();
  const updateItem = api.softSkillsAdmin.updateItem.useMutation();
  const utils = api.useUtils();

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
    [createItem, isEditMode, router, t, updateItem, utils],
  );

  const handleCancel = useCallback(() => {
    if (form.formState.isDirty) {
      const confirmLeave = window.confirm(t("unsavedChangesConfirm"));
      if (!confirmLeave) return;
    }
    router.back();
  }, [form.formState.isDirty, router, t]);

  const isSaving = createItem.isPending || updateItem.isPending;

  if (isFormLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
        <div className="bg-muted h-32 w-full animate-pulse rounded-md" />
        <div className="bg-muted h-10 w-2/3 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="soft-skill"
          statusByLangId={statusByLangId}
        />

        <FormContent>
          <FormSection title={t("generalSection")}>
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <div className="space-y-3">
                  <FormItem label={t("icon")} inputId="soft-skill-icon">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="soft-skill-icon" className="w-full">
                        <SelectValue placeholder={t("selectIcon")} />
                      </SelectTrigger>
                      <SelectContent>
                        {SOFT_SKILL_ICON_KEYS.map((key) => {
                          const Icon = resolveSoftSkillIcon(key);
                          return (
                            <SelectItem
                              key={key}
                              value={key}
                              id={`soft-skill-icon-option-${key}`}
                            >
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {key}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormItem>
                  <div className="border-border bg-muted/40 flex h-16 w-16 items-center justify-center rounded-full border">
                    <SelectedIcon className="text-primary h-8 w-8" />
                  </div>
                </div>
              )}
            />

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

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem label={t("displayOrder")} inputId="soft-skill-order">
                  <Input
                    type="number"
                    min={0}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={t("contentSection")}>
            {languages.map((lang) => {
              const isActive = lang.id === activeLangId;
              const isPrimary = lang.id === primaryLang?.id;

              return (
                <div
                  key={lang.id}
                  className={isActive ? "space-y-4" : "hidden"}
                  aria-hidden={!isActive}
                >
                  {!isPrimary && (
                    <Button
                      variant="link"
                      type="button"
                      onClick={() => copyFieldsFromPrimary(lang.id)}
                      className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs"
                    >
                      {t("copyFromPrimary", {
                        language: primaryLang?.code ?? "",
                      })}
                    </Button>
                  )}

                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.title`}
                    render={({ field: titleField }) => (
                      <FormItem
                        label={t("titleWithLanguage", {
                          language: lang.code,
                        })}
                        inputId={`soft-skill-title-${lang.code}`}
                      >
                        <Input
                          {...titleField}
                          placeholder={t("titlePlaceholder")}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.description`}
                    render={({ field: descField }) => (
                      <FormItem
                        label={t("descriptionWithLanguage", {
                          language: lang.code,
                        })}
                        inputId={`soft-skill-description-${lang.code}`}
                      >
                        <Textarea
                          {...descField}
                          placeholder={t("descriptionPlaceholder")}
                          rows={4}
                        />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending || isSaving}
          title={isEditMode ? t("save") : t("create")}
          submitId="soft-skill-form-submit"
        >
          <Button variant="ghost" type="button" onClick={handleCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
