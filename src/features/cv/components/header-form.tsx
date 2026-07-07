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
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import { CvModalFormSkeleton } from "./cv-modal-form-skeleton";
import type { Locale } from "@/i18n/config";

const HeaderSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  degree: LocalizedTextSchema,
  photoUrl: z.string().url().or(z.literal("")).optional(),
  clientImageAlt: LocalizedTextSchema.optional(),
});

type HeaderInput = z.infer<typeof HeaderSchema>;

const HeaderForm: FC = () => {
  const t = useTranslations("admin.forms.header");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const upsertHeader = api.cv.upsertHeader.useMutation();

  const [isPending, startTransition] = useTransition();

  const defaultLocale: Locale =
    (data?.profile?.defaultLocale as Locale) ?? "en";

  const form = useForm<HeaderInput>({
    resolver: zodResolver(HeaderSchema),
    defaultValues: {
      fullName: "",
      degree: { default: "" },
      photoUrl: "",
      clientImageAlt: undefined,
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      fullName: data.header?.fullName ?? "",
      degree: (data.header?.degree as { default: string } | undefined) ?? {
        default: "",
      },
      photoUrl: data.header?.photoUrl ?? "",
      clientImageAlt:
        (data.header?.clientImageAlt as { default: string } | undefined) ??
        undefined,
    });
  }, [data, form]);

  const onSubmit = useCallback(
    (input: HeaderInput) => {
      startTransition(async () => {
        try {
          await upsertHeader.mutateAsync({
            fullName: input.fullName,
            degree: input.degree,
            photoUrl: input.photoUrl ?? null,
            clientImageAlt: input.clientImageAlt ?? null,
          });
          await utils.cv.getMine.invalidate();
          toast.success(t("savedSuccess") || "Saved successfully!");
        } catch {
          toast.error(t("saveFailed") || "Failed to save");
        }
      });
    },
    [upsertHeader, utils, t],
  );

  if (isLoading) return <CvModalFormSkeleton variant="header" />;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent
          error={upsertHeader.error ? upsertHeader.error.message : null}
        >
          <FormSection title={"Header"}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem label={t("fullName")}>
                    <Input {...field} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem label={t("photoUrl")}>
                    <Input type="url" {...field} />
                  </FormItem>
                )}
              />
            </div>

            <LocalizedTextField
              name="degree"
              control={form.control}
              label={t("degree")}
              defaultLocale={defaultLocale}
              required
            />

            <LocalizedTextField
              name="clientImageAlt"
              control={form.control}
              label={t("photoAlt") || "Photo Alt Text"}
              defaultLocale={defaultLocale}
            />
          </FormSection>
        </FormContent>
        <FormActions
          isPending={
            form.formState.isSubmitting || upsertHeader.isPending || isPending
          }
          title={t("save") || "Save"}
        />
      </FormRoot>
    </Form>
  );
};

export default HeaderForm;
