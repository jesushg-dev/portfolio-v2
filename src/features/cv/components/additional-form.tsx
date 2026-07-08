"use client";

import { useTransition, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { LocalizedTextSchema } from "@/lib/i18n/localized";
import LocalizedTextField from "@/components/admin/shared/localized-text-field";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  FormActions,
  FormContent,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";

import type { Locale } from "@/i18n/config";

export const AdditionalInfoSchema = z.object({
  text: LocalizedTextSchema,
});

export type AdditionalInfoInput = z.infer<typeof AdditionalInfoSchema>;

export const AdditionalForm: FC<{
  defaultLocale: Locale;
  initial?: { id: string; text: unknown };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ defaultLocale, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.additional");
  const utils = api.useUtils();
  const create = api.cv.createAdditionalInfo.useMutation();
  const update = api.cv.updateAdditionalInfo.useMutation();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AdditionalInfoInput>({
    resolver: zodResolver(AdditionalInfoSchema),
    defaultValues: {
      text: (initial?.text as { default: string } | undefined) ?? {
        default: "",
      },
    },
  });

  const handleSubmit = (input: AdditionalInfoInput) => {
    startTransition(async () => {
      try {
        if (initial?.id) {
          await update.mutateAsync({ id: initial.id, text: input.text });
        } else {
          await create.mutateAsync({ text: input.text });
        }
        await utils.cv.getMine.invalidate();
        toast.success(t("savedSuccess"));
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("saveFailed"));
      }
    });
  };

  return (
    <Form {...form}>
      <FormRoot
        id="cv-additional-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormContent>
          <FormSection title={t("label")}>
            <LocalizedTextField
              name="text"
              control={form.control}
              label={t("label")}
              defaultLocale={defaultLocale}
              required
              inputId="cv-additional-text"
            />
          </FormSection>
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
          submitId="cv-additional-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
