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
import {
  buildEmptyTranslationMap,
  textTranslationMapFromRows,
} from "@/lib/i18n/translation-map";
import type { AppLanguage } from "@prisma/client";

export const LanguageSchema = z.object({
  name: z.record(z.string(), z.object({ text: z.string() })),
  level: z.record(z.string(), z.object({ text: z.string() })),
});

export type LanguageInput = z.infer<typeof LanguageSchema>;

export const LanguageForm: FC<{
  languages: AppLanguage[];
  initial?: {
    id: string;
    name?: unknown;
    level?: unknown;
    translations?: { appLanguageId: string; name: string; level: string }[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.language");
  const utils = api.useUtils();
  const create = api.cv.createLanguage.useMutation();
  const update = api.cv.updateLanguage.useMutation();
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
        name: textTranslationMapSchema(primaryLang?.id, t("name")),
        level: textTranslationMapSchema(primaryLang?.id, t("level")),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<LanguageInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.name,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
      level: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.level,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

  const isNonPrimary = activeLangId !== primaryLang?.id;

  const watchedNames = useWatch({ control: form.control, name: "name" });
  const watchedLevels = useWatch({ control: form.control, name: "level" });

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const nameText = watchedNames?.[lang.id]?.text?.trim();
      const nameOk = Boolean(nameText);
      const levelText = watchedLevels?.[lang.id]?.text?.trim();
      const levelOk = Boolean(levelText);

      const completedCount = [nameOk, levelOk].filter(Boolean).length;

      return {
        id: lang.id,
        name: lang.name,
        code: lang.code,
        isBase: lang.id === primaryLang?.id,
        hasContent: completedCount > 0,
        completedCount,
        totalCount: 2,
      };
    });
  }, [languages, watchedNames, watchedLevels, primaryLang?.id]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress) {
    if (!watchedNames?.[activeLangId]?.text?.trim()) {
      missingItems.push(t("name"));
    }
    if (!watchedLevels?.[activeLangId]?.text?.trim()) {
      missingItems.push(t("level"));
    }
  }

  const primaryName = watchedNames?.[primaryLang?.id ?? ""]?.text;
  const primaryLevel = watchedLevels?.[primaryLang?.id ?? ""]?.text;

  const handleSubmit = useCallback(
    (input: LanguageInput) => {
      startTransition(async () => {
        try {
          if (initial?.id) {
            await update.mutateAsync({ id: initial.id, ...input });
          } else {
            await create.mutateAsync(input);
          }
          await utils.cv.getMine.invalidate();
          toast.success(t("save") || "Saved successfully");
          onSuccess();
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : t("saveFailed") || "Save failed",
          );
        }
      });
    },
    [create, initial, onSuccess, t, update, utils],
  );

  return (
    <Form {...form}>
      <FormRoot
        id="cv-language-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormContent>
          <FormSection title={t("name")}>
            <AdminFormLanguageBar
              languages={languageProgressList}
              activeLangId={activeLangId}
              onSelectLang={setActiveLangId}
              missingItems={missingItems}
              isNonPrimary={isNonPrimary}
              showOriginal={showOriginal}
              onToggleShowOriginal={setShowOriginal}
            />

            <div className="mt-4 space-y-4">
              {isNonPrimary && showOriginal && primaryName ? (
                <ReferenceSnippet
                  content={primaryName}
                  label={t("name")}
                  onCopy={() =>
                    form.setValue(`name.${activeLangId}.text`, primaryName, {
                      shouldDirty: true,
                    })
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`name.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("name")}
                    inputId={`cv-language-name-${activeLangId}`}
                  >
                    <Input {...field} placeholder="e.g. English, Spanish" />
                  </FormItem>
                )}
              />

              {isNonPrimary && showOriginal && primaryLevel ? (
                <ReferenceSnippet
                  content={primaryLevel}
                  label={t("level")}
                  onCopy={() =>
                    form.setValue(`level.${activeLangId}.text`, primaryLevel, {
                      shouldDirty: true,
                    })
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`level.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("level")}
                    inputId={`cv-language-level-${activeLangId}`}
                  >
                    <Input
                      {...field}
                      placeholder="e.g. Native, Professional working"
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
          submitId="cv-language-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};

export default LanguageForm;
