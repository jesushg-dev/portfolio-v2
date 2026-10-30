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
import { LocalizedFormLanguageBar } from "@/components/admin/shared/localized-form-language-bar";
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

  const { languageProgress, activeLangId, setActiveLangId } = useLocalizedForm({
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
        <LocalizedFormLanguageBar
          languages={languageProgress}
          activeLangId={activeLangId}
          onSelectLang={setActiveLangId}
        />
        <FormContent>
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
        <FormActions
          isPending={isSaving}
          title={isEditMode ? t("save") : t("create")}
        >
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
