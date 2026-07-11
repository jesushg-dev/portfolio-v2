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
import { Textarea } from "@/components/ui/textarea";
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
import { localizedJsonToTextMap } from "@/lib/i18n/localized-text-map";
import type { TextTranslationMap } from "@/lib/i18n/localized-text-map";
import { CvModalFormSkeleton } from "./cv-modal-form-skeleton";
import type { AppLanguage } from "@prisma/client";

type AboutInput = {
  aboutMe: TextTranslationMap;
};

const AboutForm: FC<{ languages: AppLanguage[] }> = ({ languages }) => {
  const t = useTranslations("admin.forms.about");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();

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
        aboutMe: textTranslationMapSchema(primaryLang?.id, t("label")),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<AboutInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aboutMe: buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      aboutMe: data.aboutMe?.aboutMe
        ? localizedJsonToTextMap(data.aboutMe.aboutMe, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
    });
  }, [data, form, languages]);

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
      <FormRoot id="cv-about-form" onSubmit={form.handleSubmit(onSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="cv-about"
        />

        <FormContent
          error={upsertAboutMe.error ? upsertAboutMe.error.message : null}
        >
          <FormSection title={t("label") ?? "About Me"}>
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
                    name={`aboutMe.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("label")}
                        inputId={`cv-about-me-${lang.code}`}
                      >
                        <Textarea {...field} rows={6} />
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
            form.formState.isSubmitting || upsertAboutMe.isPending || isPending
          }
          title={t("save") || "Save"}
          submitId="cv-about-form-submit"
        />
      </FormRoot>
    </Form>
  );
};

export default AboutForm;
