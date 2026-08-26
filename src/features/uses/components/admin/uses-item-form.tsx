"use client";

import type { AppLanguage, UsesItemType } from "@prisma/client";
import { type FC, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
import { translationMapSchema } from "@/lib/i18n/localized-form";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import type {
  UsesItemCreateFormDTO,
  UsesItemEditorDTO,
} from "@/features/uses/lib/uses-editor-dto";

interface UsesItemFormProps {
  languages: AppLanguage[];
  initialData: UsesItemEditorDTO | UsesItemCreateFormDTO;
  defaultType?: UsesItemType;
}

export const UsesItemForm: FC<UsesItemFormProps> = ({
  initialData,
  languages,
  defaultType,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.usesItem");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const schema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        type: z.enum(["EVERYDAY", "SOFTWARE", "BROWSER"]),
        href: z.string().min(1, t("hrefRequired")),
        image: z.string(),
        order: z.number().int().nonnegative(),
        translations: translationMapSchema(
          z.object({
            title: z.string(),
            description: z.string(),
          }),
          undefined,
          "title",
          t("titleRequired"),
        ),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const createItem = api.usesAdmin.createItem.useMutation();
  const updateItem = api.usesAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...initialData,
      type:
        ("type" in initialData ? initialData.type : defaultType) ?? "EVERYDAY",
    } as FormValues,
    mode: "onBlur",
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData as FormValues,
    resourceId: "id" in initialData ? initialData.id : undefined,
  });

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          if (isEditMode && values.id) {
            await updateItem.mutateAsync({ id: values.id, ...values });
            toast.success(t("updatedSuccess"));
          } else {
            await createItem.mutateAsync(values);
            toast.success(t("createdSuccess"));
          }
          await utils.usesAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateItem, createItem, utils, router, t],
  );

  const isSaving = createItem.isPending || updateItem.isPending || isPending;
  const itemType = useWatch({ control: form.control, name: "type" });

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="uses-item"
        />
        <FormContent>
          <FormSection title={t("sectionBasics")}>
            <FormField
              control={form.control}
              name="href"
              render={({ field }) => (
                <FormItem label={t("href")}>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {itemType !== "BROWSER" ? (
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem label={t("image")}>
                    <FormControl>
                      <Input {...field} placeholder="/uses/..." />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem label={t("order")}>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormSection>

          {languages.map((lang) => (
            <div
              key={lang.id}
              hidden={lang.id !== activeLangId}
              aria-hidden={lang.id !== activeLangId}
            >
              <FormSection title={`${t("sectionCopy")} (${lang.code})`}>
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
                {itemType === "EVERYDAY" ? (
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.description`}
                    render={({ field }) => (
                      <FormItem label={t("description")}>
                        <FormControl>
                          <Textarea {...field} rows={2} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ) : null}
              </FormSection>
            </div>
          ))}
        </FormContent>
        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t("saving") : isEditMode ? t("save") : t("create")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
