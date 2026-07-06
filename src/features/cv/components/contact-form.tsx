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
import { Form, FormField } from "@/components/ui/form";
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

import type { Locale } from "@/i18n/config";

export const TYPES = [
  "EMAIL",
  "PHONE",
  "LINKEDIN",
  "GITHUB",
  "WEBSITE",
  "LOCATION",
  "OTHER",
] as const;

export const ContactSchema = z.object({
  type: z.enum(TYPES),
  value: z.string().min(1),
  label: LocalizedTextSchema.optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

export const ContactForm: FC<{
  defaultLocale: Locale;
  initial?: {
    id: string;
    type: (typeof TYPES)[number];
    value: string;
    label: unknown;
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ defaultLocale, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.contact");
  const utils = api.useUtils();
  const create = api.cv.createContact.useMutation();
  const update = api.cv.updateContact.useMutation();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      type: initial?.type ?? "EMAIL",
      value: initial?.value ?? "",
      label: (initial?.label as Record<string, string>) ?? {},
    },
  });

  const handleSubmit = (input: ContactInput) => {
    startTransition(async () => {
      try {
        if (initial?.id) {
          await update.mutateAsync({ id: initial.id, ...input });
        } else {
          await create.mutateAsync(input);
        }
        await utils.cv.getMine.invalidate();
        toast.success(t("save") || "Saved successfully");
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
          <FormSection>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem label={t("type")}>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((tItem) => (
                        <SelectItem key={tItem} value={tItem}>
                          {tItem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem label={t("value")}>
                  <Input placeholder="name@example.com" {...field} />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={t("labelOptional")}>
            <LocalizedTextField
              control={form.control}
              name="label"
              label={t("labelHint")}
              defaultLocale={defaultLocale}
              placeholder="e.g. Email me"
            />
          </FormSection>
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save") || "Save"}
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
