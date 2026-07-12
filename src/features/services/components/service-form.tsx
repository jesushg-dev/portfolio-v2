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
import { SkillPicker } from "@/components/admin/skill-picker";
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
  type ServiceCreateFormDTO,
  type ServiceEditorDTO,
} from "@/features/services/lib/service-editor-dto";
import { StackTypeSchema } from "@/features/portfolio/server/portfolio-admin-shared";

interface ServiceFormProps {
  languages: AppLanguage[];
  initialData: ServiceEditorDTO | ServiceCreateFormDTO;
}

export const ServiceForm: FC<ServiceFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.service");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const serviceFormSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        image: z.string().min(1, t("imageRequired")),
        type: StackTypeSchema,
        skillIds: z.array(z.string()),
        translations: titleDescriptionTranslationMapSchema(
          primaryLang?.id,
          t("titleRequiredPrimary"),
        ),
      }),
    [primaryLang?.id, t],
  );

  type TServiceForm = z.infer<typeof serviceFormSchema>;

  const createService = api.servicesAdmin.createItem.useMutation();
  const updateService = api.servicesAdmin.updateItem.useMutation();

  const { data: { data: rawSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});
  const utils = api.useUtils();

  const availableSkills = rawSkills.map((s) => ({
    id: s.id,
    title: s.title,
    image: s.image,
    type: s.type,
  }));

  const form = useForm<TServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: initialData as TServiceForm,
    mode: "onBlur",
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData as TServiceForm,
    resourceId: "id" in initialData ? initialData.id : undefined,
  });

  const onSubmit = useCallback(
    (values: TServiceForm) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateService.mutateAsync({
              id: values.id,
              ...values,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createService.mutateAsync(values);
            toast.success(t("createdSuccess"));
          }

          await utils.servicesAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateService, createService, utils, router, t],
  );

  const isSaving = createService.isPending || updateService.isPending;
  const anyError = createService.error ?? updateService.error;

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
                        inputId={`service-title-${lang.code}`}
                      >
                        <Input {...field} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.description`}
                    render={({ field }) => (
                      <FormItem
                        label={t("descriptionWithLanguage", {
                          language: lang.name ?? lang.code,
                        })}
                        inputId={`service-description-${lang.code}`}
                      >
                        <Textarea rows={4} {...field} />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}

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
