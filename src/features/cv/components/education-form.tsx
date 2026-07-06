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
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";

import type { Locale } from "@/i18n/config";

export const EducationSchema = z.object({
  institution: z.string().min(1),
  degreeName: LocalizedTextSchema,
  location: LocalizedTextSchema.optional(),
  description: LocalizedTextSchema.optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
  dates: z.string().optional(),
});

export type EducationInput = z.infer<typeof EducationSchema>;

export const EducationForm: FC<{
  defaultLocale: Locale;
  initial?: {
    id: string;
    institution: string;
    degreeName: unknown;
    location: unknown;
    description: unknown;
    startYear?: number | null;
    endYear?: number | null;
    dates?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ defaultLocale, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.education");
  const utils = api.useUtils();
  const create = api.cv.createEducation.useMutation();
  const update = api.cv.updateEducation.useMutation();
  const [isPending, startTransition] = useTransition();

  const form = useForm<EducationInput>({
    resolver: zodResolver(EducationSchema),
    defaultValues: {
      institution: initial?.institution ?? "",
      degreeName: (initial?.degreeName as { default: string } | undefined) ?? {
        default: "",
      },
      location:
        (initial?.location as { default: string } | undefined) ?? undefined,
      description:
        (initial?.description as { default: string } | undefined) ?? undefined,
      startYear: initial?.startYear ?? undefined,
      endYear: initial?.endYear ?? undefined,
      dates: initial?.dates ?? "",
    },
  });

  const handleSubmit = (input: EducationInput) => {
    startTransition(async () => {
      try {
        if (initial?.id) {
          await update.mutateAsync({ id: initial.id, ...input });
        } else {
          await create.mutateAsync(input);
        }
        await utils.cv.getMine.invalidate();
        toast.success(t("save"));
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
          <FormSection title={t("institution")}>
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem label={t("institution")}>
                  <Input {...field} />
                </FormItem>
              )}
            />

            <LocalizedTextField
              name="degreeName"
              control={form.control}
              label={t("degree")}
              defaultLocale={defaultLocale}
              required
            />
            <LocalizedTextField
              name="location"
              control={form.control}
              label={t("location")}
              defaultLocale={defaultLocale}
            />
            <LocalizedTextField
              name="description"
              control={form.control}
              label={t("description")}
              defaultLocale={defaultLocale}
              multiline
            />

            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="startYear"
                render={({ field }) => (
                  <FormItem label={t("startYear")}>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || undefined)
                      }
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endYear"
                render={({ field }) => (
                  <FormItem label={t("endYear")}>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || undefined)
                      }
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <FormItem label={t("dates")}>
                    <Input placeholder="2017 - 2024" {...field} />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting || isPending}
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
