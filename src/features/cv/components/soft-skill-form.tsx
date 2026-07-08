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

export const SoftSkillSchema = z.object({
  name: LocalizedTextSchema,
});

export type SoftSkillInput = z.infer<typeof SoftSkillSchema>;

export const SoftSkillForm: FC<{
  defaultLocale: Locale;
  initial?: { id: string; name: unknown };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ defaultLocale, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.softSkill");
  const utils = api.useUtils();
  const create = api.cv.createSoftSkill.useMutation();
  const update = api.cv.updateSoftSkill.useMutation();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SoftSkillInput>({
    resolver: zodResolver(SoftSkillSchema),
    defaultValues: {
      name: (initial?.name as { default: string } | undefined) ?? {
        default: "",
      },
    },
  });

  const handleSubmit = (input: SoftSkillInput) => {
    startTransition(async () => {
      try {
        if (initial?.id) {
          await update.mutateAsync({ id: initial.id, name: input.name });
        } else {
          await create.mutateAsync({ name: input.name });
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
        id="cv-soft-skill-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormContent>
          <FormSection title={t("label")}>
            <LocalizedTextField
              name="name"
              control={form.control}
              label={t("label")}
              defaultLocale={defaultLocale}
              required
              inputId="cv-soft-skill-text"
            />
          </FormSection>
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
          submitId="cv-soft-skill-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
