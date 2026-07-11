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
import { buildEmptyTranslationMap } from "@/lib/i18n/translation-map";
import { localizedJsonToTextMap } from "@/lib/i18n/localized-text-map";
import type { AppLanguage } from "@prisma/client";

export const AdditionalInfoSchema = z.object({
  text: z.record(z.string(), z.object({ text: z.string() })),
});

export type AdditionalInfoInput = z.infer<typeof AdditionalInfoSchema>;

export const AdditionalForm: FC<{
  languages: AppLanguage[];
  initial?: { id: string; text: unknown };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.additional");
  const utils = api.useUtils();
  const create = api.cv.createAdditionalInfo.useMutation();
  const update = api.cv.updateAdditionalInfo.useMutation();
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
        text: textTranslationMapSchema(primaryLang?.id, t("label")),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<AdditionalInfoInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: initial
        ? localizedJsonToTextMap(initial.text, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

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
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="cv-additional"
        />

        <FormContent>
          <FormSection title={t("label")}>
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
                    name={`text.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("label")}
                        inputId={`cv-additional-text-${lang.code}`}
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
