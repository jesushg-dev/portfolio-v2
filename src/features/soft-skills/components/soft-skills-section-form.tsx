"use client";

import { type FC, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { api } from "@/trpc/react";
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
import type { RouterOutputs } from "@/trpc/react";

type SectionData = RouterOutputs["softSkillsAdmin"]["getSection"];

interface SoftSkillsSectionFormProps {
  initialData: SectionData;
}

export const SoftSkillsSectionForm: FC<SoftSkillsSectionFormProps> = ({
  initialData,
}) => {
  const t = useTranslations("admin.forms.softSkillsSection");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const utils = api.useUtils();
  const upsertSection = api.softSkillsAdmin.upsertSection.useMutation();

  const schema = useMemo(
    () =>
      z.object({
        mediaType: z.enum(["VIDEO", "IMAGE"]),
        videoUrl: z.string().url().or(z.literal("")).optional(),
        posterUrl: z.string().url().or(z.literal("")).optional(),
        imageUrl: z.string().url().or(z.literal("")).optional(),
      }),
    [],
  );

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mediaType: initialData.mediaType,
      videoUrl: initialData.videoUrl ?? "",
      posterUrl: initialData.posterUrl ?? "",
      imageUrl: initialData.imageUrl ?? "",
    },
  });

  const mediaType = useWatch({
    control: form.control,
    name: "mediaType",
  });

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          await upsertSection.mutateAsync({
            mediaType: values.mediaType,
            videoUrl: values.videoUrl ?? "",
            posterUrl: values.posterUrl ?? "",
            imageUrl: values.imageUrl ?? "",
          });
          await utils.softSkillsAdmin.getSection.invalidate();
          toast.success(t("savedSuccess"));
          router.back();
        } catch {
          toast.error(t("saveFailed"));
        }
      });
    },
    [router, t, upsertSection, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          <FormSection title={t("title")} description={t("description")}>
            <FormField
              control={form.control}
              name="mediaType"
              render={({ field }) => (
                <FormItem
                  label={t("mediaType")}
                  inputId="soft-skills-section-media-type"
                >
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id="soft-skills-section-media-type"
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="VIDEO"
                        id="soft-skills-section-media-type-option-VIDEO"
                      >
                        {t("mediaVideo")}
                      </SelectItem>
                      <SelectItem
                        value="IMAGE"
                        id="soft-skills-section-media-type-option-IMAGE"
                      >
                        {t("mediaImage")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {mediaType === "VIDEO" ? (
              <>
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem
                      label={t("videoUrl")}
                      inputId="soft-skills-section-video-url"
                    >
                      <Input
                        {...field}
                        placeholder={t("videoUrlPlaceholder")}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="posterUrl"
                  render={({ field }) => (
                    <FormItem
                      label={t("posterUrl")}
                      description={t("posterUrlHint")}
                      inputId="soft-skills-section-poster-url"
                    >
                      <Input
                        {...field}
                        placeholder={t("posterUrlPlaceholder")}
                      />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem
                    label={t("imageUrl")}
                    inputId="soft-skills-section-image-url"
                  >
                    <Input {...field} placeholder={t("imageUrlPlaceholder")} />
                  </FormItem>
                )}
              />
            )}
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending}
          title={t("save")}
          submitId="soft-skills-section-form-submit"
        >
          <button type="button" onClick={() => router.back()}>
            {t("cancel")}
          </button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
