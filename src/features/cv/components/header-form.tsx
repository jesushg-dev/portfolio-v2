"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import {
  resolvePrimaryLanguage,
  textTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import { buildEmptyTranslationMap } from "@/lib/i18n/translation-map";
import {
  localizedJsonToTextMap,
  TextTranslationMapSchema,
} from "@/lib/i18n/localized-text-map";
import type { TextTranslationMap } from "@/lib/i18n/localized-text-map";
import { CvModalFormSkeleton } from "./cv-modal-form-skeleton";
import type { AppLanguage } from "@prisma/client";

type HeaderInput = {
  fullName: string;
  degree: TextTranslationMap;
  photoUrl?: string;
  clientImageAlt?: TextTranslationMap;
};

const HeaderForm: FC<{ languages: AppLanguage[] }> = ({ languages }) => {
  const t = useTranslations("admin.forms.header");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const upsertHeader = api.cv.upsertHeader.useMutation();

  const [isPending, startTransition] = useTransition();
  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );
  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );

  const formSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(1, "Full name is required"),
        degree: textTranslationMapSchema(primaryLang?.id, t("degree")),
        photoUrl: z.string().url().or(z.literal("")).optional(),
        clientImageAlt: TextTranslationMapSchema.optional(),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<HeaderInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      degree: buildEmptyTranslationMap(languages, { text: "" }),
      photoUrl: "",
      clientImageAlt: buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      fullName: data.header?.fullName ?? "",
      degree: data.header?.degree
        ? localizedJsonToTextMap(data.header.degree, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
      photoUrl: data.header?.photoUrl ?? "",
      clientImageAlt: data.header?.clientImageAlt
        ? localizedJsonToTextMap(data.header.clientImageAlt, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
    });
  }, [data, form, languages]);

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
      <FormRoot id="cv-header-form" onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="cv-header"
        />

        <FormContent
          error={upsertHeader.error ? upsertHeader.error.message : null}
        >
          <FormSection title={t("sectionTitle")}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem label={t("fullName")} inputId="cv-header-full-name">
                    <Input {...field} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem label={t("photoUrl")} inputId="cv-header-photo-url">
                    <Input type="url" {...field} />
                  </FormItem>
                )}
              />
            </div>

            {languages.map((lang) => {
              const isActive = lang.id === activeLangId;
              return (
                <div
                  key={lang.id}
                  className={isActive ? "space-y-4" : "hidden"}
                  aria-hidden={!isActive}
                >
                  <FormField
                    control={form.control}
                    name={`degree.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("degree")}
                        inputId={`cv-header-degree-${lang.code}`}
                      >
                        <Input {...field} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`clientImageAlt.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("photoAlt") || "Photo Alt Text"}
                        inputId={`cv-header-photo-alt-${lang.code}`}
                      >
                        <Input {...field} />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </FormSection>
        </FormContent>
        <FormActions
          isPending={
            form.formState.isSubmitting || upsertHeader.isPending || isPending
          }
          title={t("save") || "Save"}
          submitId="cv-header-form-submit"
        />
      </FormRoot>
    </Form>
  );
};

export default HeaderForm;
