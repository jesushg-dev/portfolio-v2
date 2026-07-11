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
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SkillPicker } from "@/components/admin/skill-picker";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
  FormCheckboxItem,
} from "@/components/shared/form-root";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import {
  resolvePrimaryLanguage,
  translationMapSchema,
} from "@/lib/i18n/localized-form";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import {
  type CertificationEditorDTO,
  type CertificationCreateFormDTO,
} from "@/features/certifications/lib/certification-editor-dto";
import { StackTypeSchema } from "@/features/portfolio/server/portfolio-admin-shared";

interface CertificationFormProps {
  languages: AppLanguage[];
  initialData: CertificationEditorDTO | CertificationCreateFormDTO;
}

export const CertificationForm: FC<CertificationFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.certification");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

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
        translations: translationMapSchema(
          z.object({
            title: z.string(),
          }),
          primaryLang?.id,
          "title",
          t("titleRequiredPrimary"),
        ),
      }),
    [primaryLang?.id, t],
  );

  type TCertForm = z.infer<typeof certFormSchema>;

  const createCert = api.certificationsAdmin.createItem.useMutation();
  const updateCert = api.certificationsAdmin.updateItem.useMutation();

  const { data: rawSkills = [] } = api.skillsAdmin.getMine.useQuery();
  const utils = api.useUtils();

  const availableSkills = rawSkills.map((s) => ({
    id: s.id,
    title: s.title,
    image: s.image,
    type: s.type,
  }));

  const form = useForm<TCertForm>({
    resolver: zodResolver(certFormSchema),
    defaultValues: initialData as TCertForm,
    mode: "onBlur",
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData as TCertForm,
    resourceId: "id" in initialData ? initialData.id : undefined,
  });

  const onSubmit = useCallback(
    (values: TCertForm) => {
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

  const isSaving = createCert.isPending || updateCert.isPending;
  const anyError = createCert.error ?? updateCert.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="certification"
        />
        <FormContent error={anyError}>
          <FormSection title={t("generalSection")}>
            {languages.map((lang) => {
              const isActive = lang.id === activeLangId;

              return (
                <div
                  key={lang.id}
                  className={isActive ? "mb-4 grid gap-4" : "hidden"}
                  aria-hidden={!isActive}
                >
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.title`}
                    render={({ field }) => (
                      <FormItem
                        label={t("titleWithLanguage", {
                          language: lang.name ?? lang.code,
                        })}
                        inputId={`certification-title-${lang.code}`}
                      >
                        <Input {...field} />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}

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

            <div className="grid grid-cols-2 gap-4">
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

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem label={t("imageUrl")} inputId="certification-image">
                  <Input placeholder={t("imageUrlPlaceholder")} {...field} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={() => (
                <FormItem
                  label={t("relatedTypes")}
                  inputId="certification-type"
                >
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
                <FormItem
                  label={t("associatedSkills")}
                  inputId="certification-skill-picker"
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
