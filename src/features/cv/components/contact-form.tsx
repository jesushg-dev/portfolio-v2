"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/trpc/react";

import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
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
import { buildEmptyTranslationMap } from "@/lib/i18n/translation-map";
import {
  localizedJsonToTextMap,
  TextTranslationMapSchema,
} from "@/lib/i18n/localized-text-map";
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

export const ContactSchema = z.object({
  type: z.enum(TYPES),
  value: z.string().min(1),
  label: TextTranslationMapSchema.optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

export const ContactForm: FC<{
  languages: AppLanguage[];
  initial?: {
    id: string;
    type: (typeof TYPES)[number];
    value: string;
    label: unknown;
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.contact");
  const utils = api.useUtils();
  const create = api.cv.createContact.useMutation();
  const update = api.cv.updateContact.useMutation();
  const [isPending, startTransition] = useTransition();

  const [activeLangId, setActiveLangId] = useState(languages[0]?.id ?? "");

  const form = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      type: initial?.type ?? "EMAIL",
      value: initial?.value ?? "",
      label: initial?.label
        ? localizedJsonToTextMap(initial.label, languages)
        : buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

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
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="cv-contact"
        />

        <FormContent>
          <FormSection>
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
                <FormItem label={t("value")} inputId="cv-contact-value">
                  <Input placeholder="name@example.com" {...field} />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={t("labelOptional")}>
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
                    name={`label.${lang.id}.text`}
                    render={({ field }) => (
                      <FormItem
                        label={t("labelHint")}
                        inputId={`cv-contact-label-${lang.code}`}
                      >
                        <Input placeholder="e.g. Email me" {...field} />
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
          title={t("save") || "Save"}
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
