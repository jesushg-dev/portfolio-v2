"use client";
import type { AppLanguage, Skill, Project } from "@prisma/client";

import { type FC, useTransition, useState, useCallback } from "react";
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

const projectFormSchema = z.object({
  id: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  type: StackTypeSchema,
  githubUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  isPrivate: z.boolean(),
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
                message: "Title is required for the primary language",
                path: ["title"],
              });
            }
          }
        }),
    )
    .refine((val) => val.length >= 1, {
      message: "At least one language is required",
    }),
});

type TProjectForm = z.infer<typeof projectFormSchema>;

interface ProjectInitialData extends Project {
  ProjectTranslation?: {
    appLanguageId: string;
    title: string;
    description: string;
  }[];
  ProjectSkill?: {
    skillId: string;
    skill?: Skill;
  }[];
}

interface ProjectFormProps {
  initialData?: ProjectInitialData;
  languages: AppLanguage[];
}

export const ProjectForm: FC<ProjectFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = !!initialData;
  const tCommon = useTranslations("admin.actions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const createProject = api.portfolioAdmin.createProject.useMutation();
  const updateProject = api.portfolioAdmin.updateProject.useMutation();
  const upsertTranslation =
    api.portfolioAdmin.upsertProjectTranslation.useMutation();
  const syncSkills = api.portfolioAdmin.syncProjectSkills.useMutation();

  const { data: rawSkills = [] } = api.portfolioAdmin.getMySkills.useQuery();
  const utils = api.useUtils();

  const availableSkills = rawSkills.map((s) => ({
    id: s.id,
    title: s.title,
    image: s.image,
    type: s.type,
  }));

  const primaryLang = languages.find((l) => l.code === "en") ?? languages[0];

  const defaultTranslations = isEditMode
    ? (() => {
        const existingTranslations =
          initialData.ProjectTranslation?.map((pt) => ({
            appLanguageId: pt.appLanguageId,
            title: pt.title,
            description: pt.description,
          })) ?? [];

        const existingLangIds = new Set(
          existingTranslations.map((t) => t.appLanguageId),
        );
        const missingLangs = languages.filter(
          (l) => !existingLangIds.has(l.id),
        );

        return [
          ...existingTranslations,
          ...missingLangs.map((l) => ({
            appLanguageId: l.id,
            title: "",
            description: "",
          })),
        ];
      })()
    : languages.map((l) => ({
        appLanguageId: l.id,
        title: "",
        description: "",
      }));

  const form = useForm<TProjectForm>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: (isEditMode
      ? {
          id: initialData.id,
          image: initialData.image ?? "",
          type: initialData.type,
          githubUrl: initialData.githubUrl ?? "",
          websiteUrl: initialData.websiteUrl ?? "",
          isPrivate: initialData.isPrivate ?? false,
          skillIds: initialData.ProjectSkill?.map((ps) => ps.skillId) ?? [],
          translations: defaultTranslations,
        }
      : {
          image: "",
          type: "FRONTEND",
          githubUrl: "",
          websiteUrl: "",
          isPrivate: false,
          skillIds: [],
          translations: defaultTranslations,
        }) as TProjectForm,
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
    (values: TProjectForm) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateProject.mutateAsync({
              id: values.id,
              image: values.image,
              type: values.type,
              githubUrl: values.githubUrl ?? null,
              websiteUrl: values.websiteUrl ?? null,
              isPrivate: values.isPrivate,
            });

            await syncSkills.mutateAsync({
              projectId: values.id,
              skillIds: values.skillIds,
            });

            await Promise.all(
              values.translations.map((trans) =>
                upsertTranslation.mutateAsync({
                  projectId: values.id!,
                  appLanguageId: trans.appLanguageId,
                  title: trans.title,
                  description: trans.description,
                }),
              ),
            );

            toast.success("Project updated");
          } else {
            await createProject.mutateAsync(values);
            toast.success("Project created");
          }

          await utils.portfolioAdmin.getMyProjects.invalidate();
          router.back();
        } catch {
          toast.error(
            isEditMode
              ? "Failed to update project"
              : "Failed to create project",
          );
        }
      });
    },
    [
      isEditMode,
      updateProject,
      syncSkills,
      upsertTranslation,
      createProject,
      utils,
      router,
    ],
  );

  const isSaving =
    createProject.isPending ||
    updateProject.isPending ||
    syncSkills.isPending ||
    upsertTranslation.isPending;
  const anyError =
    createProject.error ??
    updateProject.error ??
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
          <FormSection title="General Information">
            {activeIndex !== -1 && activeLang && (
              <div className="mb-4 grid gap-4">
                <FormField
                  control={form.control}
                  name={`translations.${activeIndex}.title`}
                  render={({ field }) => (
                    <FormItem label={`Title (${activeLang.name})`}>
                      <Input {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`translations.${activeIndex}.description`}
                  render={({ field }) => (
                    <FormItem label={`Description (${activeLang.name})`}>
                      <Textarea rows={4} {...field} />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem label="Image URL">
                  <Input placeholder="https://..." {...field} />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem label="Project Type">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
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
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormCheckboxItem
                    label="Private Project"
                    description="Hide from public portfolio"
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
                  <FormItem label="GitHub URL">
                    <Input placeholder="https://github.com/..." {...field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem label="Live Demo URL">
                    <Input placeholder="https://..." {...field} />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <FormSection title="Skills" className="mt-4 border-t pt-4">
            <FormField
              control={form.control}
              name="skillIds"
              render={({ field }) => (
                <FormItem label="Associated Skills">
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
          title={
            isEditMode
              ? tCommon("save") || "Save"
              : tCommon("addNew") || "Create"
          }
        >
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {tCommon("cancel") || "Cancel"}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
