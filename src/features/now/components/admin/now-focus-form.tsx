"use client";

import type { AppLanguage } from "@prisma/client";
import { type FC, useCallback, useMemo, useTransition } from "react";
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
  NowFocusCreateFormDTO,
  NowFocusEditorDTO,
} from "@/features/now/lib/now-editor-dto";

interface NowFocusFormProps {
  languages: AppLanguage[];
  initialData: NowFocusEditorDTO | NowFocusCreateFormDTO;
}

export const NowFocusForm: FC<NowFocusFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.nowFocus");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const schema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        order: z.number().int().nonnegative(),
        translations: translationMapSchema(
          z.object({
            label: z.string(),
            body: z.string(),
          }),
          undefined,
          "label",
          t("labelRequired"),
        ),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const createFocus = api.nowAdmin.createFocus.useMutation();
  const updateFocus = api.nowAdmin.updateFocus.useMutation();
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData as FormValues,
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
            await updateFocus.mutateAsync({ id: values.id, ...values });
            toast.success(t("updatedSuccess"));
          } else {
            await createFocus.mutateAsync(values);
            toast.success(t("createdSuccess"));
          }
          await utils.nowAdmin.getFocuses.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateFocus, createFocus, utils, router, t],
  );

  const isSaving = createFocus.isPending || updateFocus.isPending || isPending;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="now-focus"
        />
        <FormContent>
          <FormSection title={t("sectionBasics")}>
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
                  name={`translations.${lang.id}.label`}
                  render={({ field }) => (
                    <FormItem label={t("label")}>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`translations.${lang.id}.body`}
                  render={({ field }) => (
                    <FormItem label={t("body")}>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
