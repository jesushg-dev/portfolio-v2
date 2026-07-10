"use client";

import { useTransition, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
} from "@/components/shared/form-root";

export const CATEGORIES = [
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "TOOLS",
  "MOBILE",
  "DESKTOP",
  "DEVOPS",
  "CYBERSECURITY",
  "OTHER",
] as const;

export const SkillSchema = z.object({
  category: z.enum(CATEGORIES),
  itemsCsv: z.string().min(1),
});

export type SkillInput = z.infer<typeof SkillSchema>;

export const SkillForm: FC<{
  initial?: {
    id: string;
    category: (typeof CATEGORIES)[number];
    items: string[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.skills");
  const utils = api.useUtils();
  const create = api.cv.createTechnicalSkill.useMutation();
  const update = api.cv.updateTechnicalSkill.useMutation();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SkillInput>({
    resolver: zodResolver(SkillSchema),
    defaultValues: {
      category: initial?.category ?? "FRONTEND",
      itemsCsv: initial?.items?.join(", ") ?? "",
    },
  });

  const handleSubmit = (input: SkillInput) => {
    startTransition(async () => {
      try {
        const items = input.itemsCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (initial?.id) {
          await update.mutateAsync({
            id: initial.id,
            category: input.category,
            items,
          });
        } else {
          await create.mutateAsync({ category: input.category, items });
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
      <FormRoot id="cv-skill-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent>
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem label={t("category")} inputId="cv-skill-category">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger id="cv-skill-category" className="w-full">
                      <SelectValue placeholder={t("category")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        id={`cv-skill-category-option-${c}`}
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itemsCsv"
            render={({ field }) => (
              <FormItem label={t("items")} inputId="cv-skill-items">
                <Input
                  placeholder="React, Next.js, Tailwind, Redux"
                  {...field}
                />
              </FormItem>
            )}
          />
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
          submitId="cv-skill-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
