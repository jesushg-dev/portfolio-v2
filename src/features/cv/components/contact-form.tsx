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
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import {
  resolvePrimaryLanguage,
  TextTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import {
  buildEmptyTranslationMap,
  textTranslationMapFromRows,
} from "@/lib/i18n/translation-map";
import type { AppLanguage } from "@prisma/client";

export const TYPES = [
  "EMAIL",
  "PHONE",
  "LINKEDIN",
  "GITHUB",
  "WEBSITE",
  "LOCATION",
  "CALENDLY",
  "OTHER",
] as const;

const PLACEHOLDERS: Record<(typeof TYPES)[number], string> = {
  EMAIL: "name@domain.com",
  PHONE: "+1 (555) 000-0000",
  LINKEDIN: "https://www.linkedin.com/in/username",
  GITHUB: "https://github.com/username",
  WEBSITE: "https://example.com",
  LOCATION: "City, Country",
  CALENDLY: "https://calendly.com/username",
  OTHER: "https://...",
};

export const ContactSchema = z.object({
  type: z.enum(TYPES),
  value: z.string().min(1, "Value is required"),
  label: TextTranslationMapSchema.optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

export const ContactForm: FC<{
  languages: AppLanguage[];
  initial?: {
    id: string;
    type: (typeof TYPES)[number];
    value: string;
    label?: unknown;
    translations?: { appLanguageId: string; label: string }[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.contact");
  const utils = api.useUtils();
  const create = api.cv.createContact.useMutation();
  const update = api.cv.updateContact.useMutation();
  const [isPending, startTransition] = useTransition();

  const [showOriginal, setShowOriginal] = useState(true);

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );
  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );

  const form = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      type: initial?.type ?? "EMAIL",
      value: initial?.value ?? "",
      label: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.label,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

  const contactType = useWatch({ control: form.control, name: "type" });
  const watchedLabels = useWatch({ control: form.control, name: "label" });
  const isNonPrimary = activeLangId !== primaryLang?.id;

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const labelText = watchedLabels?.[lang.id]?.text?.trim();
      const hasContent = Boolean(labelText);

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
  }, [languages, watchedLabels, primaryLang?.id]);

  const primaryLabel = watchedLabels?.[primaryLang?.id ?? ""]?.text;

  const handleSubmit = useCallback(
    (input: ContactInput) => {
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
      <FormRoot id="cv-contact-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent>
          <FormSection title={t("type")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem label={t("type")} inputId="cv-contact-type">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="cv-contact-type" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYPES.map((tItem) => (
                          <SelectItem
                            key={tItem}
                            value={tItem}
                            id={`cv-contact-type-option-${tItem}`}
                          >
                            {tItem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem
                    label={t("value")}
                    inputId="cv-contact-value"
                    description={
                      contactType === "LOCATION"
                        ? t("locationValueHint")
                        : undefined
                    }
                  >
                    <Input
                      {...field}
                      placeholder={PLACEHOLDERS[contactType] || "Contact value"}
                    />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <FormSection title={t("labelOptional")}>
            <AdminFormLanguageBar
              languages={languageProgressList}
              activeLangId={activeLangId}
              onSelectLang={setActiveLangId}
              isNonPrimary={isNonPrimary}
              showOriginal={showOriginal}
              onToggleShowOriginal={setShowOriginal}
            />

            <div className="mt-4">
              {isNonPrimary && showOriginal && primaryLabel ? (
                <ReferenceSnippet
                  content={primaryLabel}
                  label={t("labelOptional")}
                  onCopy={() =>
                    form.setValue(`label.${activeLangId}.text`, primaryLabel, {
                      shouldDirty: true,
                    })
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`label.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("labelOptional")}
                    description={t("labelHint")}
                    inputId={`cv-contact-label-${activeLangId}`}
                  >
                    <Input
                      {...field}
                      placeholder="e.g. linkedin.com/in/username"
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
          submitId="cv-contact-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};

export default ContactForm;
