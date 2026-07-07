"use client";
import type { AppLanguage, Certification } from "@prisma/client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { SkillPicker } from "@/components/admin/skill-picker";
import { fillMissingTranslations } from "@/utils/form-translations";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
  FormCheckboxItem,
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

interface CertificationInitialData extends Certification {
  CertificationTranslation?: {
    appLanguageId: string;
    title: string;
  }[];
  CertificateSkill?: {
    skillId: string;
  }[];
}

interface CertificationFormProps {
  initialData?: CertificationInitialData;
  languages: AppLanguage[];
}

export const CertificationForm: FC<CertificationFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = !!initialData;
  const t = useTranslations("admin.forms.certification");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const certFormSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        company: z.string().min(1, t("companyRequired")),
        issuedDate: z.number().int().optional().nullable(),
        url: z.string().url().optional().or(z.literal("")),
        idCredential: z.string().optional().or(z.literal("")),
        image: z.string().optional().or(z.literal("")),
        type: z.array(StackTypeSchema),
        skillIds: z.array(z.string()),
        translations: z
          .array(
            z
              .object({
                appLanguageId: z.string(),
                title: z.string(),
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

  type TCertForm = z.infer<typeof certFormSchema>;

  const createCert = api.portfolioAdmin.createCertification.useMutation();
  const updateCert = api.portfolioAdmin.updateCertification.useMutation();
  const upsertTranslation =
    api.portfolioAdmin.upsertCertificationTranslation.useMutation();
  const syncSkills = api.portfolioAdmin.syncCertificationSkills.useMutation();

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

  const form = useForm<TCertForm>({
    resolver: zodResolver(certFormSchema),
    defaultValues: {
      id: isEditMode ? initialData.id : undefined,
      company: isEditMode ? (initialData.company ?? "") : "",
      issuedDate: isEditMode ? initialData.issuedDate : undefined,
      url: isEditMode ? (initialData.url ?? "") : "",
      idCredential: isEditMode ? (initialData.idCredential ?? "") : "",
      image: isEditMode ? (initialData.image ?? "") : "",
      type: isEditMode ? (initialData.type ?? []) : [],
      skillIds: isEditMode
        ? (initialData.CertificateSkill?.map((s) => s.skillId) ?? [])
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
    (values: TCertForm) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateCert.mutateAsync({
              id: values.id,
              company: values.company,
              issuedDate: values.issuedDate ?? null,
              url: values.url ?? null,
              idCredential: values.idCredential ?? null,
              image: values.image ?? null,
              type: values.type,
            });

            await syncSkills.mutateAsync({
              certificationId: values.id,
              skillIds: values.skillIds,
            });

            await Promise.all(
              values.translations
                .filter((tr) => tr.title.trim() !== "")
                .map((trans) =>
                  upsertTranslation.mutateAsync({
                    certificationId: values.id!,
                    appLanguageId: trans.appLanguageId,
                    title: trans.title,
                  }),
                ),
            );

            toast.success(t("updatedSuccess"));
          } else {
            await createCert.mutateAsync({
              ...values,
              issuedDate: values.issuedDate ?? undefined,
              url: values.url ?? undefined,
              idCredential: values.idCredential ?? undefined,
              image: values.image ?? undefined,
            });
            toast.success(t("createdSuccess"));
          }

          await utils.portfolioAdmin.getMyCertifications.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [
      isEditMode,
      updateCert,
      syncSkills,
      upsertTranslation,
      createCert,
      utils,
      router,
      t,
    ],
  );

  const isSaving =
    createCert.isPending ||
    updateCert.isPending ||
    syncSkills.isPending ||
    upsertTranslation.isPending;
  const anyError =
    createCert.error ??
    updateCert.error ??
    upsertTranslation.error ??
    syncSkills.error;

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
                    >
                      <Input {...field} />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem label={t("issuingCompany")}>
                  <Input
                    placeholder={t("issuingCompanyPlaceholder")}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem label={t("credentialUrl")}>
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
                  <FormItem label={t("credentialId")}>
                    <Input
                      placeholder={t("credentialIdPlaceholder")}
                      {...field}
                    />
                  </FormItem>
                )}
              />
            </div>

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
              render={() => (
                <FormItem label={t("relatedTypes")}>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {StackTypeSchema.options.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="type"
                        render={({ field }) => {
                          return (
                            <FormCheckboxItem key={item} label={item}>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item,
                                        ),
                                      );
                                }}
                              />
                            </FormCheckboxItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection
            title={t("skillsSection")}
            className="mt-4 border-t pt-4"
          >
            <FormField
              control={form.control}
              name="skillIds"
              render={({ field }) => (
                <FormItem label={t("associatedSkills")}>
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
