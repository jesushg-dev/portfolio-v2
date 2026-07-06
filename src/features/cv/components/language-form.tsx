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
import {
  FormActions,
  FormContent,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";

import type { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";

export const LanguageSchema = z.object({
  name: LocalizedTextSchema,
  level: LocalizedTextSchema,
});

export type LanguageInput = z.infer<typeof LanguageSchema>;

export const LanguageForm: FC<{
  defaultLocale: Locale;
  initial?: { id: string; name: unknown; level: unknown };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ defaultLocale, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.language");
  const utils = api.useUtils();
  const create = api.cv.createLanguage.useMutation();
  const update = api.cv.updateLanguage.useMutation();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LanguageInput>({
    resolver: zodResolver(LanguageSchema),
    defaultValues: {
      name: (initial?.name as { default: string } | undefined) ?? {
        default: "",
      },
      level: (initial?.level as { default: string } | undefined) ?? {
        default: "",
      },
    },
  });

  const handleSubmit = (input: LanguageInput) => {
    startTransition(async () => {
      try {
        if (initial?.id) {
          await update.mutateAsync({ id: initial.id, ...input });
        } else {
          await create.mutateAsync(input);
        }
        await utils.cv.getMine.invalidate();
        toast.success(t("savedSuccess") || "Saved successfully");
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("saveFailed") || "Save failed",
        );
      }
    });
  };

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent>
          <FormSection title={"Language"}>
            <LocalizedTextField
              name="name"
              control={form.control}
              label={t("name")}
              defaultLocale={defaultLocale}
              required
            />
            <LocalizedTextField
              name="level"
              control={form.control}
              label={t("level")}
              defaultLocale={defaultLocale}
              required
            />
          </FormSection>
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
