"use client";

import type { AppLanguage } from "@prisma/client";
import { type FC, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import {
  buildEmptyUsesClarificationDto,
  type UsesItemEditorDTO,
  type UsesSettingsEditorDTO,
} from "@/features/uses/lib/uses-editor-dto";
import { UsesWorkspaceTagEditor } from "@/features/uses/components/admin/uses-workspace-tag-editor";

interface UsesSettingsFormProps {
  languages: AppLanguage[];
  initialData: UsesSettingsEditorDTO;
  taggableItems: UsesItemEditorDTO[];
}

export const UsesSettingsForm: FC<UsesSettingsFormProps> = ({
  initialData,
  languages,
  taggableItems,
}) => {
  const t = useTranslations("admin.forms.usesSettings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const schema = useMemo(
    () =>
      z.object({
        workspaceImage: z.string(),
        codingPreviewLight: z.string(),
        codingPreviewDark: z.string(),
        translations: z.record(
          z.string(),
          z.object({
            codingIntro: z.string(),
            browserIntro: z.string(),
          }),
        ),
        clarifications: z.array(
          z.object({
            id: z.string().optional(),
            order: z.number().int().nonnegative(),
            translations: z.record(
              z.string(),
              z.object({
                body: z.string(),
              }),
            ),
          }),
        ),
        workspaceTags: z.array(
          z.object({
            id: z.string().optional(),
            usesItemId: z.string(),
            xPercent: z.number(),
            yPercent: z.number(),
            order: z.number().int().nonnegative(),
          }),
        ),
      }),
    [],
  );

  type FormValues = z.infer<typeof schema>;

  const upsert = api.usesAdmin.upsertSettings.useMutation();
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData,
    resourceId: initialData.id,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "clarifications",
  });

  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag,
    update: updateTag,
  } = useFieldArray({
    control: form.control,
    name: "workspaceTags",
  });

  const workspaceImage = useWatch({
    control: form.control,
    name: "workspaceImage",
  });

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          const saved = await upsert.mutateAsync({
            ...values,
            clarifications: values.clarifications.map((item, index) => ({
              ...item,
              order: index,
            })),
            workspaceTags: values.workspaceTags
              .filter((tag) => tag.usesItemId.trim().length > 0)
              .map((tag, index) => ({
                ...tag,
                order: index,
              })),
          });
          form.reset(saved);
          await utils.usesAdmin.getSettings.invalidate();
          toast.success(t("updatedSuccess"));
          router.refresh();
        } catch {
          toast.error(t("updateFailed"));
        }
      });
    },
    [form, upsert, utils, router, t],
  );

  const isSaving = upsert.isPending || isPending;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="uses-settings"
        />
        <FormContent>
          <FormSection title={t("sectionMedia")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="workspaceImage"
                render={({ field }) => (
                  <FormItem label={t("workspaceImage")}>
                    <FormControl>
                      <Input {...field} placeholder="/uses/setup.webp" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codingPreviewLight"
                render={({ field }) => (
                  <FormItem label={t("codingPreviewLight")}>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="/uses/coding/code-light.webp"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codingPreviewDark"
                render={({ field }) => (
                  <FormItem label={t("codingPreviewDark")}>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="/uses/coding/code-dark.webp"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <FormSection
            title={t("sectionWorkspaceTags")}
            description={t("sectionWorkspaceTagsHint")}
          >
            <UsesWorkspaceTagEditor
              imageSrc={workspaceImage}
              tags={tagFields.map((field, index) => ({
                clientId: field.id,
                usesItemId: field.usesItemId,
                xPercent: field.xPercent,
                yPercent: field.yPercent,
                order: field.order ?? index,
              }))}
              items={taggableItems}
              activeLangId={activeLangId}
              onAdd={(tag) => appendTag(tag)}
              onUpdate={(index, tag) => updateTag(index, tag)}
              onRemove={(index) => removeTag(index)}
            />
          </FormSection>

          {languages.map((lang) => (
            <div
              key={lang.id}
              hidden={lang.id !== activeLangId}
              aria-hidden={lang.id !== activeLangId}
            >
              <FormSection
                title={t("sectionCopy")}
                description={t("sectionCopyHint")}
              >
                <FormField
                  control={form.control}
                  name={`translations.${lang.id}.codingIntro`}
                  render={({ field }) => (
                    <FormItem
                      label={t("codingIntro")}
                      description={t("optionalMarkdownHint")}
                    >
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`translations.${lang.id}.browserIntro`}
                  render={({ field }) => (
                    <FormItem
                      label={t("browserIntro")}
                      description={t("optionalMarkdownHint")}
                    >
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </FormSection>
            </div>
          ))}

          <FormSection
            title={t("sectionClarifications")}
            description={t("sectionClarificationsHint")}
          >
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border-border space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {t("clarificationLabel", { index: index + 1 })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="mr-1 size-4" />
                      {t("removeClarification")}
                    </Button>
                  </div>
                  {languages.map((lang) => (
                    <div
                      key={lang.id}
                      hidden={lang.id !== activeLangId}
                      aria-hidden={lang.id !== activeLangId}
                    >
                      <FormField
                        control={form.control}
                        name={`clarifications.${index}.translations.${lang.id}.body`}
                        render={({ field: bodyField }) => (
                          <FormItem
                            label={t("clarificationBody")}
                            description={t("optionalMarkdownHint")}
                          >
                            <FormControl>
                              <Textarea {...bodyField} rows={3} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append(
                    buildEmptyUsesClarificationDto(languages, fields.length),
                  )
                }
              >
                <Plus className="mr-1 size-4" />
                {t("addClarification")}
              </Button>
            </div>
          </FormSection>
        </FormContent>
        <FormActions
          isPending={isSaving}
          title={isSaving ? t("saving") : t("save")}
        />
      </FormRoot>
    </Form>
  );
};
