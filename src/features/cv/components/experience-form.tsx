"use client";

import { useTransition, type FC } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { LocalizedTextSchema } from "@/lib/i18n/localized";
import LocalizedTextField from "@/components/admin/shared/localized-text-field";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { GripVertical } from "lucide-react";
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

export const ResponsibilitySchema = z.object({
  text: LocalizedTextSchema,
  order: z.number().int().nonnegative(),
});

export const ExperienceSchema = z.object({
  company: z.string().min(1),
  role: LocalizedTextSchema,
  location: LocalizedTextSchema.optional(),
  dates: z.string().optional(),
  current: z.boolean(),
  skills: z.string().optional(),
  responsibilities: z.array(ResponsibilitySchema),
});

export type ExperienceInput = z.infer<typeof ExperienceSchema>;

export const ExperienceForm: FC<{
  defaultLocale: Locale;
  initial?: {
    id: string;
    company: string;
    role: unknown;
    location: unknown;
    dates?: string | null;
    current?: boolean;
    skills?: string | null;
    responsibilities: { text: unknown; order: number }[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ defaultLocale, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.experience");
  const utils = api.useUtils();
  const create = api.cv.createExperience.useMutation();
  const update = api.cv.updateExperience.useMutation();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ExperienceInput>({
    resolver: zodResolver(ExperienceSchema),
    defaultValues: {
      company: initial?.company ?? "",
      role: (initial?.role as { default: string } | undefined) ?? {
        default: "",
      },
      location:
        (initial?.location as { default: string } | undefined) ?? undefined,
      dates: initial?.dates ?? "",
      current: initial?.current ?? false,
      skills: initial?.skills ?? "",
      responsibilities:
        initial?.responsibilities
          ?.sort((a, b) => a.order - b.order)
          .map((r, index) => ({
            text: (r.text as { default: string }) ?? { default: "" },
            order: index,
          })) ?? [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "responsibilities",
  });

  const handleSubmit = (input: ExperienceInput) => {
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
          <FormSection title={t("company")}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem label={t("company")}>
                    <Input {...field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <FormItem label={t("dates")}>
                    <Input
                      placeholder="August 2023 – February 2025"
                      {...field}
                    />
                  </FormItem>
                )}
              />
            </div>

            <LocalizedTextField
              name="role"
              control={form.control}
              label={t("role")}
              defaultLocale={defaultLocale}
              required
            />

            <LocalizedTextField
              name="location"
              control={form.control}
              label={t("location")}
              defaultLocale={defaultLocale}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem label={t("skills")}>
                  <Input {...field} />
                </FormItem>
              )}
            />

            <label className="text-foreground flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...form.register("current")}
                className="border-border text-primary focus:ring-primary rounded"
              />{" "}
              {t("current")}
            </label>
          </FormSection>

          <FormSection
            title={t("responsibilities")}
            className="mt-4 border-t pt-4"
          >
            <Sortable
              value={fields}
              onMove={({ activeIndex, overIndex }) => {
                move(activeIndex, overIndex);
              }}
              getItemValue={(item) => item.id}
            >
              <SortableContent asChild>
                <div className="flex flex-col gap-0">
                  {fields.map((field, idx) => (
                    <SortableItem key={field.id} value={field.id} asChild>
                      <div className="border-border/70 flex flex-col gap-3 border-t pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-start gap-2">
                          <SortableItemHandle className="text-muted-foreground hover:text-foreground mt-8">
                            <GripVertical className="size-4" />
                          </SortableItemHandle>
                          <div className="flex-1">
                            <LocalizedTextField
                              name={`responsibilities.${idx}.text`}
                              control={form.control}
                              label={t("responsibility", { n: idx + 1 })}
                              defaultLocale={defaultLocale}
                              required
                              multiline
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-muted-foreground hover:text-destructive mt-8 text-xs font-medium transition-colors"
                          >
                            {t("remove")}
                          </button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContent>
            </Sortable>
            <button
              type="button"
              onClick={() =>
                append({ text: { default: "" }, order: fields.length })
              }
              className="border-border bg-background text-foreground hover:bg-muted mt-4 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
            >
              {t("addResponsibility")}
            </button>
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
