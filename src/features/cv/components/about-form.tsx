"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { FC } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import {
  AdminFormLanguageBar,
  ReferenceSnippet,
  type LanguageProgress,
} from "@/components/admin/shared/admin-form-language-bar";
import { Button } from "@/components/ui/button";
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
import {
  buildEmptyTranslationMap,
  textTranslationMapFromRows,
  type TextTranslationMap,
} from "@/lib/i18n/translation-map";
import { CvModalFormSkeleton } from "./cv-modal-form-skeleton";
import type { AppLanguage } from "@prisma/client";

interface AboutInput {
  aboutMe: TextTranslationMap;
}

export const AboutForm: FC<{
  languages: AppLanguage[];
  onSuccess?: () => void;
  onCancel?: () => void;
}> = ({ languages, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.about");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();

  const [isPending, startTransition] = useTransition();
  const [showOriginal, setShowOriginal] = useState(true);

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
      aboutMe: data.aboutMe?.translations
        ? textTranslationMapFromRows(
            languages,
            data.aboutMe.translations,
            (row) => row.aboutMe,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
    });
  }, [data, form, languages]);

  const isNonPrimary = activeLangId !== primaryLang?.id;
  const watchedAbout = useWatch({ control: form.control, name: "aboutMe" });

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const aboutText = watchedAbout?.[lang.id]?.text?.trim();
      const hasContent = Boolean(aboutText);

      return {
        id: lang.id,
        name: lang.name,
        code: lang.code,
        isBase: lang.id === primaryLang?.id,
        hasContent,
        completedCount: hasContent ? 1 : 0,
        totalCount: 1,
      };
    });
  }, [languages, watchedAbout, primaryLang?.id]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress && !watchedAbout?.[activeLangId]?.text?.trim()) {
    missingItems.push(t("label"));
  }

  const primaryAbout = watchedAbout?.[primaryLang?.id ?? ""]?.text;

  const onSubmit = useCallback(
    (input: AboutInput) => {
      startTransition(async () => {
        try {
          await upsertAboutMe.mutateAsync({ aboutMe: input.aboutMe });
          await utils.cv.getMine.invalidate();
          toast.success(t("savedSuccess") || "Saved successfully!");
          onSuccess?.();
        } catch {
          toast.error(t("saveFailed") || "Failed to save");
        }
      });
    },
    [upsertAboutMe, utils, t, onSuccess],
  );

  if (isLoading) return <CvModalFormSkeleton variant="about" />;

  return (
    <Form {...form}>
      <FormRoot id="cv-about-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent
          error={upsertAboutMe.error ? upsertAboutMe.error.message : null}
        >
          <FormSection title={t("label")}>
            <AdminFormLanguageBar
              languages={languageProgressList}
              activeLangId={activeLangId}
              onSelectLang={setActiveLangId}
              missingItems={missingItems}
              isNonPrimary={isNonPrimary}
              showOriginal={showOriginal}
              onToggleShowOriginal={setShowOriginal}
            />

            <div className="mt-4 flex flex-col gap-4">
              {isNonPrimary && showOriginal && primaryAbout ? (
                <ReferenceSnippet
                  content={primaryAbout}
                  label={t("label")}
                  onCopy={() =>
                    form.setValue(
                      `aboutMe.${activeLangId}.text`,
                      primaryAbout,
                      { shouldDirty: true },
                    )
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`aboutMe.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("label")}
                    inputId={`cv-about-me-${activeLangId}`}
                  >
                    <Textarea
                      {...field}
                      rows={7}
                      placeholder={t("label")}
                      className="resize-y"
                    />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </FormContent>
        <FormActions
          isPending={
            form.formState.isSubmitting || upsertAboutMe.isPending || isPending
          }
          title={t("save") || "Save"}
          submitId="cv-about-form-submit"
        >
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("cancel") || "Cancel"}
            </Button>
          ) : null}
        </FormActions>
      </FormRoot>
    </Form>
  );
};

export default AboutForm;
