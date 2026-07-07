"use no memo";
"use client";

import { type FC, useTransition, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import type { RouterOutputs } from "@/trpc/react";
import type { AppLanguage } from "@prisma/client";

interface TimelineItemFormProps {
  initialData?: RouterOutputs["timelineAdmin"]["getMine"][number];
  languages: AppLanguage[];
}

export const TimelineItemForm: FC<TimelineItemFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = !!initialData;
  const t = useTranslations("admin.forms.timelineItem");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
          .min(1, t("atLeastOneLanguage")),
      }),
    [t],
  );

  type TExpForm = z.infer<typeof expFormSchema>;

  const createItem = api.timelineAdmin.createItem.useMutation();
  const updateItem = api.timelineAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const primaryLang = languages.find((l) => l.code === "en") ?? languages[0];

  const defaultTranslations = isEditMode
    ? (() => {
        const existingTranslations = Object.entries(
          (
            initialData.title as {
              translations?: Record<string, string>;
            } | null
          )?.translations ?? {},
        ).map(([langId, title]) => ({
          appLanguageId: langId,
          title: title,
          description:
            (
              initialData.description as {
                translations?: Record<string, string>;
              } | null
            )?.translations?.[langId] ?? "",
        }));

        const existingLangIds = new Set(
          existingTranslations.map((tr) => tr.appLanguageId),
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

  const form = useForm<TExpForm>({
    resolver: zodResolver(expFormSchema),
    defaultValues: (isEditMode
      ? {
          id: initialData.id,
          organization: initialData.organization ?? "",
          location: initialData.location ?? "",
          category: initialData.category,
          startDate: initialData.startDate
            ? new Date(initialData.startDate).toISOString().split("T")[0]
            : "",
          endDate: initialData.endDate
            ? new Date(initialData.endDate).toISOString().split("T")[0]
            : "",
          current: initialData.current ?? false,
          order: initialData.order ?? 0,
          translations: defaultTranslations,
        }
      : {
          organization: "",
          location: "",
          category: "WORK",
          startDate: "",
          endDate: "",
          current: false,
          order: 0,
          translations: defaultTranslations,
        }) as TExpForm,
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
  const isCurrent = useWatch({ control: form.control, name: "current" });

  const onSubmit = useCallback(
    (values: TExpForm) => {
      startTransition(async () => {
        try {
          const enTrans =
            values.translations.find((entry) => entry.appLanguageId === "en") ??
            values.translations[0];

          const titlePayload = {
            default: enTrans.title,
            translations: Object.fromEntries(
              values.translations.map((entry) => [
                entry.appLanguageId,
                entry.title,
              ]),
            ),
          };

          const descriptionPayload = {
            default: enTrans.description,
            translations: Object.fromEntries(
              values.translations.map((entry) => [
                entry.appLanguageId,
                entry.description,
              ]),
            ),
          };

          if (isEditMode && values.id) {
            await updateItem.mutateAsync({
              id: values.id,
              title: titlePayload,
              description: descriptionPayload,
              category: values.category,
              organization: values.organization,
              location: values.location ?? undefined,
              startDate: new Date(values.startDate),
              endDate:
                values.current || !values.endDate
                  ? undefined
                  : new Date(values.endDate),
              current: values.current,
              order: values.order,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createItem.mutateAsync({
              title: titlePayload,
              description: descriptionPayload,
              category: values.category,
              organization: values.organization,
              location: values.location ?? undefined,
              startDate: new Date(values.startDate),
              endDate:
                values.current || !values.endDate
                  ? undefined
                  : new Date(values.endDate),
              current: values.current,
              order: values.order,
            });
            toast.success(t("createdSuccess"));
          }

          await utils.timelineAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateItem, createItem, utils, router, t],
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
        />

        <FormContent error={anyError}>
          <FormSection title={t("generalSection")}>
            {activeIndex !== -1 && (
              <div className="mb-4 grid gap-4">
                <FormField
                  control={form.control}
                  name={`translations.${activeIndex}.title`}
                  render={({ field }) => (
                    <FormItem label={t("title")}>
                      <Input placeholder={t("titlePlaceholder")} {...field} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`translations.${activeIndex}.description`}
                  render={({ field }) => (
                    <FormItem label={t("description")}>
                      <Textarea
                        rows={4}
                        placeholder={t("descriptionPlaceholder")}
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem label={t("organization")}>
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
                  <FormItem label={t("category")}>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCategory")} />
                      </SelectTrigger>
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
                  <FormItem label={t("location")}>
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
                  <FormItem label={t("startDate")}>
                    <Input type="date" {...field} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem label={t("endDate")}>
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
                  <FormItem label={t("currentEntry")}>
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
                  <FormItem label={t("displayOrder")}>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                    />
                  </FormItem>
                )}
              />
            </div>
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
