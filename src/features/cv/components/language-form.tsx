"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
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
          toast.success(t("savedSuccess") || "Saved successfully");
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
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="cv-language"
        />

        <FormContent>
          <FormSection title="Language">
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
                    name={`name.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("name")}
                        inputId={`cv-language-name-${lang.code}`}
                      >
                        <Input {...field} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`level.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("level")}
                        inputId={`cv-language-level-${lang.code}`}
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
