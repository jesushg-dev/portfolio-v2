"use client";
import type { AppLanguage, Skill } from "@prisma/client";

import { type FC, useTransition, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
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

const StackTypeSchema = z.enum([
  "FRONTEND",
  "BACKEND",
  "MOBILE",
  "DESKTOP",
  "CYBERSECURITY",
  "DEVOPS",
  "SOFTSKILLS",
  "TOOLS",
]);

interface SkillInitialData extends Skill {
  SkillTranslation?: {
    appLanguageId: string;
    description?: string | null;
    urlWiki?: string | null;
  }[];
}

interface SkillFormProps {
  initialData?: SkillInitialData;
  languages: AppLanguage[];
}

export const SkillForm: FC<SkillFormProps> = ({ initialData, languages }) => {
  const isEditMode = !!initialData;
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
        translations: z.array(
          z.object({
            appLanguageId: z.string(),
            description: z.string(),
            urlWiki: z.string(),
          }),
        ),
      }),
    [t],
  );

  type TSkillForm = z.infer<typeof skillFormSchema>;

  const createSkill = api.portfolioAdmin.createSkill.useMutation();
  const updateSkill = api.portfolioAdmin.updateSkill.useMutation();
  const upsertTranslation =
    api.portfolioAdmin.upsertSkillTranslation.useMutation();

  const utils = api.useUtils();

  const primaryLang = languages.find((l) => l.code === "en") ?? languages[0];

  const defaultTranslations = isEditMode
    ? (() => {
        const existingTranslations =
          initialData.SkillTranslation?.map((st) => ({
            appLanguageId: st.appLanguageId,
            description: st.description ?? "",
            urlWiki: st.urlWiki ?? "",
          })) ?? [];

        const existingLangIds = new Set(
          existingTranslations.map((tr) => tr.appLanguageId),
        );
        const missingLangs = languages.filter(
          (l) => !existingLangIds.has(l.id),
        );

        return [
          ...existingTranslations,
          ...missingLangs.map((l) => ({
            appLanguageId: l.id,
            description: "",
            urlWiki: "",
          })),
        ];
      })()
    : languages.map((l) => ({
        appLanguageId: l.id,
        description: "",
        urlWiki: "",
      }));

  const form = useForm<TSkillForm>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: isEditMode
      ? {
          id: initialData.id,
          title: initialData.title ?? "",
          image: initialData.image ?? "",
          type: initialData.type,
          translations: defaultTranslations,
        }
      : {
          title: "",
          image: "",
          type: "FRONTEND",
          translations: defaultTranslations,
        },
    mode: "onBlur",
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "translations",
  });

  const [activeLangId, setActiveLangId] = useState<string>(
    isEditMode
      ? (fields[0]?.appLanguageId ?? languages[0]?.id ?? "")
      : (primaryLang?.id ?? languages[0]?.id ?? ""),
  );

  const activeIndex = fields.findIndex((f) => f.appLanguageId === activeLangId);
  const activeLang = languages.find((l) => l.id === activeLangId);

  const onSubmit = useCallback(
    (values: TSkillForm) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateSkill.mutateAsync({
              id: values.id,
              title: values.title,
              image: values.image,
              type: values.type,
            });

            await Promise.all(
              values.translations
                .filter(
                  (tr) =>
                    tr.description.trim() !== "" || tr.urlWiki.trim() !== "",
                )
                .map((trans) =>
                  upsertTranslation.mutateAsync({
                    skillId: values.id!,
                    appLanguageId: trans.appLanguageId,
                    description: trans.description ?? "",
                    urlWiki: trans.urlWiki ?? "",
                  }),
                ),
            );

            toast.success(t("updatedSuccess"));
          } else {
            await createSkill.mutateAsync({
              title: values.title,
              image: values.image,
              type: values.type,
              translations: values.translations
                .filter(
                  (tr) =>
                    tr.description.trim() !== "" || tr.urlWiki.trim() !== "",
                )
                .map((tr) => ({
                  appLanguageId: tr.appLanguageId,
                  description: tr.description ?? "",
                  urlWiki: tr.urlWiki ?? "",
                })),
            });

            toast.success(t("createdSuccess"));
          }

          await utils.portfolioAdmin.getMySkills.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [
      isEditMode,
      updateSkill,
      upsertTranslation,
      createSkill,
      utils,
      router,
      t,
    ],
  );

  const isSaving =
    createSkill.isPending ||
    updateSkill.isPending ||
    upsertTranslation.isPending;
  const anyError =
    createSkill.error ?? updateSkill.error ?? upsertTranslation.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
        />
        <FormContent error={anyError}>
          <FormSection title={t("generalSection")}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem label={t("title")}>
                  <Input placeholder={t("titlePlaceholder")} {...field} />
                </FormItem>
              )}
            />

            {activeIndex !== -1 && activeLang && (
              <div className="mt-4 grid gap-4">
                <FormField
                  control={form.control}
                  name={`translations.${activeIndex}.description`}
                  render={({ field }) => (
                    <FormItem
                      label={t("descriptionWithLanguage", {
                        language: activeLang.name,
                      })}
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
                  name={`translations.${activeIndex}.urlWiki`}
                  render={({ field }) => (
                    <FormItem
                      label={t("wikiUrlWithLanguage", {
                        language: activeLang.name,
                      })}
                    >
                      <Input placeholder={t("wikiUrlPlaceholder")} {...field} />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem label={t("imageUrl")}>
                    <Input placeholder={t("imageUrlPlaceholder")} {...field} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem label={t("type")}>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {StackTypeSchema.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
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
        >
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
