"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
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
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
} from "@/lib/i18n/translation-map";
import type { AppLanguage } from "@prisma/client";

export const AdditionalInfoSchema = z.object({
  text: z.record(z.string(), z.object({ text: z.string() })),
});

export type AdditionalInfoInput = z.infer<typeof AdditionalInfoSchema>;

export const AdditionalForm: FC<{
  languages: AppLanguage[];
  initial?: {
    id: string;
    text?: unknown;
    translations?: { appLanguageId: string; text: string }[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.additional");
  const utils = api.useUtils();
  const create = api.cv.createAdditionalInfo.useMutation();
  const update = api.cv.updateAdditionalInfo.useMutation();
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
        text: textTranslationMapSchema(primaryLang?.id, t("label")),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<AdditionalInfoInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.text,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

  const isNonPrimary = activeLangId !== primaryLang?.id;
  const watchedText = useWatch({ control: form.control, name: "text" });

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const textVal = watchedText?.[lang.id]?.text?.trim();
      const hasContent = Boolean(textVal);

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
  }, [languages, watchedText, primaryLang?.id]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress && !watchedText?.[activeLangId]?.text?.trim()) {
    missingItems.push(t("label"));
  }

  const primaryText = watchedText?.[primaryLang?.id ?? ""]?.text;

  const handleSubmit = useCallback(
    (input: AdditionalInfoInput) => {
      startTransition(async () => {
        try {
          if (initial?.id) {
            await update.mutateAsync({ id: initial.id, text: input.text });
          } else {
            await create.mutateAsync({ text: input.text });
          }
          await utils.cv.getMine.invalidate();
          toast.success(t("savedSuccess"));
          onSuccess();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t("saveFailed"));
        }
      });
    },
    [create, initial, onSuccess, t, update, utils],
  );

  return (
    <Form {...form}>
      <FormRoot
        id="cv-additional-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormContent>
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

            <div className="mt-4">
              {isNonPrimary && showOriginal && primaryText ? (
                <ReferenceSnippet
                  content={primaryText}
                  label={t("label")}
                  onCopy={() =>
                    form.setValue(`text.${activeLangId}.text`, primaryText, {
                      shouldDirty: true,
                    })
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`text.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("label")}
                    inputId={`cv-additional-text-${activeLangId}`}
                  >
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="e.g. Available to work remotely across US & EU time zones."
                    />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </FormContent>

        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
          submitId="cv-additional-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};

export default AdditionalForm;
