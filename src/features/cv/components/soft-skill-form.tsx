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

export const SoftSkillSchema = z.object({
  name: z.record(z.string(), z.object({ text: z.string() })),
});

export type SoftSkillInput = z.infer<typeof SoftSkillSchema>;

export const SoftSkillForm: FC<{
  languages: AppLanguage[];
  initial?: {
    id: string;
    name?: unknown;
    translations?: { appLanguageId: string; name: string }[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.softSkill");
  const utils = api.useUtils();
  const create = api.cv.createSoftSkill.useMutation();
  const update = api.cv.updateSoftSkill.useMutation();
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
        name: textTranslationMapSchema(primaryLang?.id, t("label")),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<SoftSkillInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.name,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

  const isNonPrimary = activeLangId !== primaryLang?.id;
  const watchedNames = useWatch({ control: form.control, name: "name" });

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const nameText = watchedNames?.[lang.id]?.text?.trim();
      const hasContent = Boolean(nameText);

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
  }, [languages, watchedNames, primaryLang?.id]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress && !watchedNames?.[activeLangId]?.text?.trim()) {
    missingItems.push(t("label"));
  }

  const primaryName = watchedNames?.[primaryLang?.id ?? ""]?.text;

  const handleSubmit = useCallback(
    (input: SoftSkillInput) => {
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
    },
    [create, initial, onSuccess, t, update, utils],
  );

  return (
    <Form {...form}>
      <FormRoot
        id="cv-soft-skill-form"
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
              {isNonPrimary && showOriginal && primaryName ? (
                <ReferenceSnippet
                  content={primaryName}
                  label={t("label")}
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
                    label={t("label")}
                    inputId={`cv-soft-skill-text-${activeLangId}`}
                  >
                    <Input
                      {...field}
                      placeholder="e.g. Leadership, Strategic Planning"
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

export default SoftSkillForm;
