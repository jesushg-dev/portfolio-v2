"use client";

import { type FC, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Plus, Trash2 } from "lucide-react";
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
  type TimelineCreateFormDTO,
  type TimelineFormDTO,
} from "@/features/timeline/lib/timeline-editor-dto";
import { api } from "@/trpc/react";
import type { AppLanguage } from "@prisma/client";

interface TimelineItemFormProps {
  languages: AppLanguage[];
  initialData: TimelineFormDTO | TimelineCreateFormDTO;
}

export const TimelineItemForm: FC<TimelineItemFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.timelineItem");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const expFormSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        organization: z.string().min(1, t("organizationRequired")),
        location: z.string().optional().or(z.literal("")),
        category: z.enum(["WORK", "STUDY", "COURSE"]),
        startDate: z.string().min(1, t("startDateRequired")),
        endDate: z.string().optional().or(z.literal("")),
        current: z.boolean(),
        images: z.array(
          z.object({
            url: z.string().url(t("imageUrlInvalid")).or(z.literal("")),
          }),
        ),
        translations: titleDescriptionTranslationMapSchema(
          primaryLang?.id,
          t("titleRequiredPrimary"),
        ),
      }),
    [primaryLang?.id, t],
  );

  type TExpForm = z.infer<typeof expFormSchema>;

  const createItem = api.timelineAdmin.createItem.useMutation();
  const updateItem = api.timelineAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const form = useForm<TExpForm>({
    resolver: zodResolver(expFormSchema),
    defaultValues: initialData as TExpForm,
    mode: "onBlur",
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData as TExpForm,
    resourceId: "id" in initialData ? initialData.id : undefined,
    completenessFields: ["title", "description"],
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const imageUrls = useWatch({ control: form.control, name: "images" });
  const isCurrent = useWatch({ control: form.control, name: "current" });

  const onSubmit = useCallback(
    (values: TExpForm) => {
      startTransition(async () => {
        try {
          const mutationValues = {
            ...values,
            location: values.location ?? undefined,
            startDate: new Date(values.startDate),
            endDate: values.endDate ? new Date(values.endDate) : undefined,
            images: values.images
              .map((entry) => entry.url.trim())
              .filter(Boolean),
          };

          if (isEditMode && values.id) {
            await updateItem.mutateAsync({
              ...mutationValues,
              id: values.id,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createItem.mutateAsync(mutationValues);
            toast.success(t("createdSuccess"));
          }

          await utils.timelineAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [createItem, isEditMode, router, t, updateItem, utils],
  );

  const isSaving = createItem.isPending || updateItem.isPending;
  const anyError = createItem.error ?? updateItem.error;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="timeline"
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
                    render={({ field: titleField }) => (
                      <FormItem
                        label={t("title")}
                        inputId={`timeline-title-${lang.code}`}
                      >
                        <Input
                          placeholder={t("titlePlaceholder")}
                          {...titleField}
                        />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.description`}
                    render={({ field: descField }) => (
                      <FormItem
                        label={t("description")}
                        inputId={`timeline-description-${lang.code}`}
                      >
                        <Textarea
                          rows={4}
                          placeholder={t("descriptionPlaceholder")}
                          {...descField}
                        />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem
                  label={t("organization")}
                  inputId="timeline-organization"
                >
                  <Input
                    placeholder={t("organizationPlaceholder")}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem label={t("category")} inputId="timeline-category">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCategory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="WORK">
                          {t("categoryWork")}
                        </SelectItem>
                        <SelectItem value="STUDY">
                          {t("categoryStudy")}
                        </SelectItem>
                        <SelectItem value="COURSE">
                          {t("categoryCourse")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem label={t("location")} inputId="timeline-location">
                    <Input placeholder={t("locationPlaceholder")} {...field} />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem
                    label={t("startDate")}
                    inputId="timeline-start-date"
                  >
                    <Input type="date" {...field} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem label={t("endDate")} inputId="timeline-end-date">
                    <Input type="date" disabled={isCurrent} {...field} />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem
                    label={t("currentEntry")}
                    inputId="timeline-current"
                  >
                    <div className="flex h-10 items-center">
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("endDate", "");
                          }
                        }}
                      />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <FormSection title={t("imagesSection")} description={t("imagesHint")}>
            <div className="space-y-4">
              {imageFields.map((field, index) => {
                const previewUrl = imageUrls?.[index]?.url?.trim() ?? "";

                return (
                  <div
                    key={field.id}
                    className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start"
                  >
                    {previewUrl ? (
                      <div className="bg-muted relative h-20 w-full shrink-0 overflow-hidden rounded-md sm:h-20 sm:w-28">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <FormField
                        control={form.control}
                        name={`images.${index}.url`}
                        render={({ field: urlField }) => (
                          <FormItem
                            label={t("imagesLabel")}
                            inputId={`timeline-image-${index}`}
                          >
                            <FormControl>
                              <Input
                                {...urlField}
                                type="url"
                                placeholder={t("imageUrlPlaceholder")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeImage(index)}
                      aria-label={t("removeImage")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendImage({ url: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addImage")}
              </Button>
            </div>
          </FormSection>
        </FormContent>
        <FormActions
          isPending={isPending || isSaving}
          title={isEditMode ? t("save") : t("create")}
          submitId="timeline-form-submit"
        >
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
