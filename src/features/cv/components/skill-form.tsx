"use client";

import { useTransition, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
          await update.mutateAsync({ id: initial.id, category: input.category, items });
        } else {
          await create.mutateAsync({ category: input.category, items });
        }
        await utils.cv.getMine.invalidate();
        toast.success(t("save") || "Saved successfully");
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : (t("saveFailed") || "Save failed"));
      }
    });
  };

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent>
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem label={t("category")}>
                <select
                  id="category"
                  {...field}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-1"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itemsCsv"
            render={({ field }) => (
              <FormItem label={t("items")}>
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
