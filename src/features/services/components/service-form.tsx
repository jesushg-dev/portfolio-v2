"use client";
import type { AppLanguage, Skill, Service } from "@prisma/client";

import { type FC, useTransition, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fillMissingTranslations } from "@/utils/form-translations";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillPicker } from "@/components/admin/skill-picker";
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

interface ServiceInitialData extends Service {
  ServiceTranslation?: {
    appLanguageId: string;
    title: string;
    description: string;
  }[];
  ServiceSkill?: {
    skillId: string;
    skill?: Skill;
  }[];
}

interface ServiceFormProps {
  initialData?: ServiceInitialData;
  languages: AppLanguage[];
}

export const ServiceForm: FC<ServiceFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = !!initialData;
  const t = useTranslations("admin.forms.service");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const serviceFormSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        image: z.string().min(1, t("imageRequired")),
        type: StackTypeSchema,
        skillIds: z.array(z.string()),
        translations: z
          .array(
            z
              .object({
                appLanguageId: z.string(),
                title: z.string(),
                description: z.string(),
              })
              .superRefine((val, ctx) => {
                if (val.appLanguageId === "en") {
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
          .refine((val) => val.length >= 1, {
            message: t("atLeastOneLanguage"),
          }),
      }),
    [t],
  );

  type TServiceForm = z.infer<typeof serviceFormSchema>;

  const createService = api.portfolioAdmin.createService.useMutation();
  const updateService = api.portfolioAdmin.updateService.useMutation();
  const upsertTranslation =
    api.portfolioAdmin.upsertServiceTranslation.useMutation();
  const syncSkills = api.portfolioAdmin.syncServiceSkills.useMutation();

  const { data: rawSkills = [] } = api.portfolioAdmin.getMySkills.useQuery();
  const utils = api.useUtils();

  const availableSkills = rawSkills.map((s) => ({
    id: s.id,
    title: s.title,
    image: s.image,
    type: s.type,
  }));

  const primaryLang = languages.find((l) => l.code === "en") ?? languages[0];

  const defaultTranslations = fillMissingTranslations(
    isEditMode ? initialData : {},
    languages,
  );

  const form = useForm<TServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      id: isEditMode ? initialData.id : undefined,
      image: isEditMode ? (initialData.image ?? "") : "",
      type: isEditMode ? initialData.type : "FRONTEND",
      skillIds: isEditMode
        ? (initialData.ServiceSkill?.map((ss) => ss.skillId) ?? [])
        : [],
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
    (values: TServiceForm) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateService.mutateAsync({
              id: values.id,
              image: values.image,
              type: values.type,
            });

            await syncSkills.mutateAsync({
              serviceId: values.id,
              skillIds: values.skillIds,
            });

            await Promise.all(
              values.translations
                .filter(
                  (tr) =>
                    tr.title.trim() !== "" || tr.description.trim() !== "",
                )
                .map((trans) =>
                  upsertTranslation.mutateAsync({
                    serviceId: values.id!,
                    appLanguageId: trans.appLanguageId,
                    title: trans.title,
                    description: trans.description,
                  }),
                ),
            );

            toast.success(t("updatedSuccess"));
          } else {
            await createService.mutateAsync(values);
            toast.success(t("createdSuccess"));
          }

          await utils.portfolioAdmin.getMyServices.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [
      isEditMode,
      updateService,
      syncSkills,
      upsertTranslation,
      createService,
      utils,
      router,
      t,
    ],
  );

  const isSaving =
    createService.isPending ||
    updateService.isPending ||
    syncSkills.isPending ||
    upsertTranslation.isPending;
  const anyError =
    createService.error ??
    updateService.error ??
    upsertTranslation.error ??
    syncSkills.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="service"
        />
        <FormContent error={anyError}>
          <FormSection title={t("generalSection")}>
            {activeIndex !== -1 && activeLang && (
              <div className="mb-4 grid gap-4">
                <FormField
                  control={form.control}
                  name={`translations.${activeIndex}.title`}
                  render={({ field }) => (
                    <FormItem
                      label={t("titleWithLanguage", {
                        language: activeLang.name,
                      })}
                      inputId={`service-title-${activeLang.code}`}
                    >
                      <Input {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`translations.${activeIndex}.description`}
                  render={({ field }) => (
                    <FormItem
                      label={t("descriptionWithLanguage", {
                        language: activeLang.name,
                      })}
                      inputId={`service-description-${activeLang.code}`}
                    >
                      <Textarea rows={4} {...field} />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem label={t("imageUrl")} inputId="service-image">
                    <Input placeholder={t("imageUrlPlaceholder")} {...field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem label={t("serviceType")} inputId="service-type">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectType")} />
                        </SelectTrigger>
                      </FormControl>
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

          <FormSection
            title={t("skillsSection")}
            className="mt-4 border-t pt-4"
          >
            <FormField
              control={form.control}
              name="skillIds"
              render={({ field }) => (
                <FormItem
                  label={t("associatedSkills")}
                  inputId="service-skill-picker"
                >
                  <SkillPicker
                    availableSkills={availableSkills}
                    selectedSkillIds={field.value}
                    onChange={field.onChange}
                  />
                </FormItem>
              )}
            />
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
