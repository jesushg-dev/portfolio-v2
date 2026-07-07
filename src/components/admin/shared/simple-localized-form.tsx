"use client";

import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

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

export interface IItem {
  id: string;
  text: unknown;
}

export const ItemSchema = z.object({
  text: LocalizedTextSchema,
});
export type ItemInput = z.infer<typeof ItemSchema>;

export const SimpleLocalizedForm: FC<{
  fieldLabel: string;
  defaultLocale: Locale;
  initial?: IItem;
  onSubmit: (data: ItemInput) => Promise<void>;
  onCancel: () => void;
}> = ({ fieldLabel, defaultLocale, initial, onSubmit, onCancel }) => {
  const t = useTranslations("admin.forms");

  const form = useForm<ItemInput>({
    resolver: zodResolver(ItemSchema),
    defaultValues: {
      text: (initial?.text as { default: string } | undefined) ?? {
        default: "",
      },
    },
  });

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          <FormSection title={fieldLabel}>
            <LocalizedTextField
              name="text"
              control={form.control}
              label={fieldLabel}
              defaultLocale={defaultLocale}
              required
            />
          </FormSection>
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting}
          title={t("save")}
          onClick={onCancel}
        >
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:bg-muted rounded-md px-4 py-2 text-sm"
          >
            {t("cancel")}
          </button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
