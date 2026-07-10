"use client";

import { type FC, useTransition, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Form, FormField } from "@/components/ui/form";
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
  languageMapFromLocalized,
  localizedFromLanguageMap,
} from "@/features/profile/server/hero-titles";
import {
  SOFT_SKILL_ICON_KEYS,
  resolveSoftSkillIcon,
} from "@/features/soft-skills/lib/soft-skill-icons";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";
import type { AppLanguage } from "@prisma/client";

interface SoftSkillFormProps {
  initialData?: RouterOutputs["softSkillsAdmin"]["getMine"][number];
  languages: AppLanguage[];
}

export const SoftSkillForm: FC<SoftSkillFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = !!initialData;
  const t = useTranslations("admin.forms.portfolioSoftSkill");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryLang = languages.find((l) => l.code === "en") ?? languages[0];

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        icon: z.string().min(1, t("iconRequired")),
        isVisible: z.boolean(),
        order: z.number().int().nonnegative(),
        translations: z
          .array(
            z
              .object({
                appLanguageId: z.string(),
                title: z.string(),
                description: z.string(),
              })
              .superRefine((val, ctx) => {
                if (val.appLanguageId === primaryLang?.id) {
                  if (!val.title || val.title.trim() === "") {
                    ctx.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: t("titleRequiredPrimary"),
                      path: ["title"],
                    });
                  }
                }
              }),
          )
          .min(1, t("atLeastOneLanguage")),
      }),
    [primaryLang?.id, t],
  );

  type FormValues = z.infer<typeof formSchema>;

  const createItem = api.softSkillsAdmin.createItem.useMutation();
  const updateItem = api.softSkillsAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const languageCodes = languages.map((language) => language.code);

  const defaultTranslations = isEditMode
    ? (() => {
        const titleMap = languageMapFromLocalized(
          initialData.title,
          languageCodes,
        );
        const descriptionMap = languageMapFromLocalized(
          initialData.description,
          languageCodes,
        );

        return languages.map((language) => ({
          appLanguageId: language.id,
          title: titleMap[language.code] ?? "",
          description: descriptionMap[language.code] ?? "",
        }));
      })()
    : languages.map((l) => ({
        appLanguageId: l.id,
        title: "",
        description: "",
      }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: (isEditMode
      ? {
          id: initialData.id,
          icon: initialData.icon,
          isVisible: initialData.isVisible,
          order: initialData.order,
          translations: defaultTranslations,
        }
      : {
          icon: "RiTeamLine",
          isVisible: true,
          order: 0,
          translations: defaultTranslations,
        }) as FormValues,
    mode: "onBlur",
  });

  const { fields: translationFields } = useFieldArray({
    control: form.control,
    name: "translations",
  });

  const [activeLangId, setActiveLangId] = useState<string>(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );

  const activeIndex = translationFields.findIndex(
    (f) => f.appLanguageId === activeLangId,
  );

  const selectedIcon = useWatch({ control: form.control, name: "icon" });
  const SelectedIcon = resolveSoftSkillIcon(selectedIcon);

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          const primaryCode = primaryLang?.code ?? "en";

          const titleByCode = Object.fromEntries(
            values.translations.map((entry) => {
              const language = languages.find(
                (lang) => lang.id === entry.appLanguageId,
              );
              return [language?.code ?? primaryCode, entry.title];
            }),
          );

          const descriptionByCode = Object.fromEntries(
            values.translations.map((entry) => {
              const language = languages.find(
                (lang) => lang.id === entry.appLanguageId,
              );
              return [language?.code ?? primaryCode, entry.description];
            }),
          );

          const payload = {
            icon: values.icon,
            isVisible: values.isVisible,
            order: values.order,
            title: localizedFromLanguageMap(titleByCode, primaryCode),
            description: localizedFromLanguageMap(
              descriptionByCode,
              primaryCode,
            ),
          };

          if (isEditMode && values.id) {
            await updateItem.mutateAsync({ id: values.id, ...payload });
            toast.success(t("updatedSuccess"));
          } else {
            await createItem.mutateAsync(payload);
            toast.success(t("createdSuccess"));
          }

          await utils.softSkillsAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [
      createItem,
      isEditMode,
      languages,
      primaryLang,
      router,
      t,
      updateItem,
      utils,
    ],
  );

  const isSaving = createItem.isPending || updateItem.isPending;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="soft-skill"
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

          {activeIndex >= 0 ? (
            <FormSection title={t("contentSection")}>
              <FormField
                control={form.control}
                name={`translations.${activeIndex}.title`}
                render={({ field }) => (
                  <FormItem
                    label={t("titleWithLanguage", {
                      language:
                        languages.find((l) => l.id === activeLangId)?.code ??
                        "",
                    })}
                    inputId="soft-skill-title"
                  >
                    <Input {...field} placeholder={t("titlePlaceholder")} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`translations.${activeIndex}.description`}
                render={({ field }) => (
                  <FormItem
                    label={t("descriptionWithLanguage", {
                      language:
                        languages.find((l) => l.id === activeLangId)?.code ??
                        "",
                    })}
                    inputId="soft-skill-description"
                  >
                    <Textarea
                      {...field}
                      placeholder={t("descriptionPlaceholder")}
                      rows={4}
                    />
                  </FormItem>
                )}
              />
            </FormSection>
          ) : null}
        </FormContent>

        <FormActions
          isPending={isPending || isSaving}
          title={isEditMode ? t("save") : t("create")}
          submitId="soft-skill-form-submit"
        >
          <button type="button" onClick={() => router.back()}>
            {t("cancel")}
          </button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
