"use client";

import { useEffect, useCallback, useTransition } from "react";
import type { FC } from "react";
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

import { CvModalFormSkeleton } from "./cv-modal-form-skeleton";
import type { Locale } from "@/i18n/config";

const AboutSchema = z.object({
  aboutMe: LocalizedTextSchema,
});

type AboutInput = z.infer<typeof AboutSchema>;

const AboutForm: FC = () => {
  const t = useTranslations("admin.forms.about");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();

  const [isPending, startTransition] = useTransition();

  const defaultLocale: Locale =
    (data?.profile?.defaultLocale as Locale) ?? "en";

  const form = useForm<AboutInput>({
    resolver: zodResolver(AboutSchema),
    defaultValues: { aboutMe: { default: "" } },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      aboutMe: (data.aboutMe?.aboutMe as { default: string } | undefined) ?? {
        default: "",
      },
    });
  }, [data, form]);

  const onSubmit = useCallback(
    (input: AboutInput) => {
      startTransition(async () => {
        try {
          await upsertAboutMe.mutateAsync({ aboutMe: input.aboutMe });
          await utils.cv.getMine.invalidate();
          toast.success(t("savedSuccess") || "Saved successfully!");
        } catch {
          toast.error(t("saveFailed") || "Failed to save");
        }
      });
    },
    [upsertAboutMe, utils, t],
  );

  if (isLoading) return <CvModalFormSkeleton variant="about" />;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent
          error={upsertAboutMe.error ? upsertAboutMe.error.message : null}
        >
          <FormSection title={t("label") ?? "About Me"}>
            <LocalizedTextField
              name="aboutMe"
              control={form.control}
              label={t("label")}
              multiline
              defaultLocale={defaultLocale}
              required
            />
          </FormSection>
        </FormContent>
        <FormActions
          isPending={
            form.formState.isSubmitting || upsertAboutMe.isPending || isPending
          }
          title={t("save") || "Save"}
        />
      </FormRoot>
    </Form>
  );
};

export default AboutForm;
