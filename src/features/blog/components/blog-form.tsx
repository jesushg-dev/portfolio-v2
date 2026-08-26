"use client";

import type { AppLanguage } from "@prisma/client";
import { type FC, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  resolvePrimaryLanguage,
  translationMapSchema,
} from "@/lib/i18n/localized-form";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import {
  type BlogPostCreateFormDTO,
  type BlogPostEditorDTO,
} from "@/features/blog/lib/blog-editor-dto";
import { TiptapEditor } from "@/features/blog/components/tiptap-editor";

interface BlogFormProps {
  languages: AppLanguage[];
  initialData: BlogPostEditorDTO | BlogPostCreateFormDTO;
}

export const BlogForm: FC<BlogFormProps> = ({ initialData, languages }) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.blog");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const blogFormSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        slug: z.string().min(1, t("slugRequired")),
        coverImage: z.string(),
        tags: z.array(z.string()),
        seriesName: z.string(),
        seriesOrder: z.number().int().nullable(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
        publishedAt: z.string().nullable(),
        translations: translationMapSchema(
          z.object({
            title: z.string(),
            excerpt: z.string(),
            content: z.string(),
          }),
          primaryLang?.id,
          "title",
          t("titleRequired"),
        ),
      }),
    [primaryLang?.id, t],
  );

  type TBlogForm = z.infer<typeof blogFormSchema>;

  const createPost = api.blogAdmin.createItem.useMutation();
  const updatePost = api.blogAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const form = useForm<TBlogForm, unknown, TBlogForm>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: initialData as TBlogForm,
    mode: "onBlur",
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form: form as unknown as Parameters<typeof useLocalizedForm>[0]["form"],
    buildDefaultValues: () => initialData as TBlogForm,
    resourceId: isEditMode ? (initialData).id : undefined,
  });

  const onSubmit = useCallback(
    (values: TBlogForm) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updatePost.mutateAsync({ ...values, id: values.id });
            toast.success(t("updatedSuccess"));
          } else {
            await createPost.mutateAsync(values);
            toast.success(t("createdSuccess"));
          }
          await utils.blogAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updatePost, createPost, utils, router, t],
  );

  const isSaving = createPost.isPending || updatePost.isPending;
  const anyError = createPost.error ?? updatePost.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="blog"
        />
        <FormContent error={anyError}>
          <FormSection title={t("generalSection")}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem label={t("slug")}>
                    <FormControl>
                      <Input placeholder="my-blog-post" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem label={t("coverImage")}>
                    <FormControl>
                      <Input placeholder="Cloudinary public ID or URL" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem label={t("status")}>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
                        <SelectItem value="PUBLISHED">
                          {t("statusPublished")}
                        </SelectItem>
                        <SelectItem value="ARCHIVED">
                          {t("statusArchived")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem label={t("tags")}>
                    <FormControl>
                      <Input
                        placeholder="tag1, tag2, tag3"
                        value={field.value.join(", ")}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="seriesName"
                render={({ field }) => (
                  <FormItem label={t("seriesName")}>
                    <FormControl>
                      <Input placeholder="react-performance" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seriesOrder"
                render={({ field }) => (
                  <FormItem label={t("seriesOrder")}>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <FormSection title={t("contentSection")}>
            {languages.map((lang) => {
              const isActive = lang.id === activeLangId;
              return (
                <div
                  key={lang.id}
                  className={isActive ? "grid gap-4" : "hidden"}
                  aria-hidden={!isActive}
                >
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.title`}
                    render={({ field }) => (
                      <FormItem label={t("title")}>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.excerpt`}
                    render={({ field }) => (
                      <FormItem label={t("excerpt")}>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.content`}
                    render={({ field }) => (
                      <FormItem label={t("content")}>
                        <TiptapEditor
                          content={field.value}
                          onChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </FormSection>
        </FormContent>

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending || isSaving}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending || isSaving}>
            {isSaving
              ? t("saving")
              : isEditMode
                ? t("update")
                : t("create")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
