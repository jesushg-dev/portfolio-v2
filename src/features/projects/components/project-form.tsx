"use client";
import type { AppLanguage } from "@prisma/client";

import { type FC, useTransition, useCallback, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  FormCheckboxItem,
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
  type ProjectCreateFormDTO,
  type ProjectEditorDTO,
} from "@/features/projects/lib/project-editor-dto";
import { StackTypeSchema } from "@/lib/admin/portfolio-schemas";

interface ProjectFormProps {
  languages: AppLanguage[];
  initialData: ProjectEditorDTO | ProjectCreateFormDTO;
}

export const ProjectForm: FC<ProjectFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.project");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const projectFormSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        image: z.string().min(1, t("imageRequired")),
        type: StackTypeSchema,
        githubUrl: z.string().url().optional().or(z.literal("")),
        websiteUrl: z.string().url().optional().or(z.literal("")),
        isPrivate: z.boolean(),
        skillIds: z.array(z.string()),
        translations: titleDescriptionTranslationMapSchema(
          primaryLang?.id,
          t("titleRequiredPrimary"),
        ),
      }),
    [primaryLang?.id, t],
  );

  type TProjectForm = z.infer<typeof projectFormSchema>;

  const createProject = api.projectsAdmin.createItem.useMutation();
  const updateProject = api.projectsAdmin.updateItem.useMutation();

  const { data: rawSkills = [] } = api.skillsAdmin.getMine.useQuery();
  const utils = api.useUtils();

  const availableSkills = rawSkills.map((skill) => ({
    id: skill.id,
    title: skill.title,
    image: skill.image,
    type: skill.type,
  }));

  const form = useForm<TProjectForm>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialData as TProjectForm,
    mode: "onBlur",
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData as TProjectForm,
    resourceId: "id" in initialData ? initialData.id : undefined,
  });

  const onSubmit = useCallback(
    (values: TProjectForm) => {
      startTransition(async () => {
        try {
          const data = {
            ...values,
            githubUrl: values.githubUrl ?? undefined,
            websiteUrl: values.websiteUrl ?? undefined,
          };
          if (isEditMode && values.id) {
            await updateProject.mutateAsync({
              ...data,
              id: values.id,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createProject.mutateAsync(data);
            toast.success(t("createdSuccess"));
          }

          await utils.projectsAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateProject, createProject, utils, router, t],
  );

  const isSaving = createProject.isPending || updateProject.isPending;
  const anyError = createProject.error ?? updateProject.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="project"
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
                        inputId={`project-title-${lang.code}`}
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
                        inputId={`project-description-${lang.code}`}
                      >
                        <Textarea rows={4} {...field} />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem label={t("imageUrl")} inputId="project-image">
                  <Input placeholder={t("imageUrlPlaceholder")} {...field} />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem label={t("projectType")} inputId="project-type">
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
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormCheckboxItem
                    label={t("privateProject")}
                    description={t("privateProjectDescription")}
                  >
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormCheckboxItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem label={t("githubUrl")} inputId="project-github-url">
                    <Input placeholder={t("githubUrlPlaceholder")} {...field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem
                    label={t("liveDemoUrl")}
                    inputId="project-live-demo-url"
                  >
                    <Input placeholder={t("imageUrlPlaceholder")} {...field} />
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
                  inputId="project-skill-picker"
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
