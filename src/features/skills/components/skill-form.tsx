"use client";
import type { AppLanguage } from "@prisma/client";

import { type FC, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { translationMapSchema } from "@/lib/i18n/localized-form";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import {
  type SkillCreateFormDTO,
  type SkillEditorDTO,
} from "@/features/skills/lib/skill-editor-dto";
import { StackTypeSchema } from "@/features/portfolio/server/portfolio-admin-shared";

interface SkillFormProps {
  languages: AppLanguage[];
  initialData: SkillEditorDTO | SkillCreateFormDTO;
}

export const SkillForm: FC<SkillFormProps> = ({ initialData, languages }) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.portfolioSkill");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const skillFormSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        title: z.string().min(1, t("titleRequired")),
        image: z.string().min(1, t("imageRequired")),
        type: StackTypeSchema,
        translations: translationMapSchema(
          z.object({
            description: z.string(),
            urlWiki: z.string(),
          }),
          undefined,
          "description",
          t("titleRequired"),
        ),
      }),
    [t],
  );

  type TSkillForm = z.infer<typeof skillFormSchema>;

  const createSkill = api.skillsAdmin.createItem.useMutation();
  const updateSkill = api.skillsAdmin.updateItem.useMutation();

  const utils = api.useUtils();

  const form = useForm<TSkillForm>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: initialData as TSkillForm,
    mode: "onBlur",
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData as TSkillForm,
    resourceId: "id" in initialData ? initialData.id : undefined,
  });

  const onSubmit = useCallback(
    (values: TSkillForm) => {
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

  const isSaving = createSkill.isPending || updateSkill.isPending;
  const anyError = createSkill.error ?? updateSkill.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="skill"
        />
        <FormContent error={anyError}>
          <FormSection title={t("generalSection")}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem label={t("title")} inputId="skill-title">
                  <Input placeholder={t("titlePlaceholder")} {...field} />
                </FormItem>
              )}
            />

            {languages.map((lang) => {
              const isActive = lang.id === activeLangId;

              return (
                <div
                  key={lang.id}
                  className={isActive ? "mt-4 grid gap-4" : "hidden"}
                  aria-hidden={!isActive}
                >
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.description`}
                    render={({ field }) => (
                      <FormItem
                        label={t("descriptionWithLanguage", {
                          language: lang.name ?? lang.code,
                        })}
                        inputId={`skill-description-${lang.code}`}
                      >
                        <Textarea
                          rows={3}
                          placeholder={t("descriptionPlaceholder")}
                          {...field}
                        />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.urlWiki`}
                    render={({ field }) => (
                      <FormItem
                        label={t("wikiUrlWithLanguage", {
                          language: lang.name ?? lang.code,
                        })}
                        inputId={`skill-wiki-${lang.code}`}
                      >
                        <Input
                          placeholder={t("wikiUrlPlaceholder")}
                          {...field}
                        />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
            <div className="mt-4 grid grid-cols-2 gap-4">
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
                name="type"
                render={({ field }) => (
                  <FormItem label={t("type")} inputId="skill-type">
                    <Select onValueChange={field.onChange} value={field.value}>
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
          </FormSection>
        </FormContent>
        <FormActions
          isPending={isPending || isSaving}
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
