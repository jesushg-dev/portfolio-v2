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

export interface PersonalReferenceInput {
  name: string;
  contact: string;
  role: Record<string, { text: string }>;
}

export const PersonalReferenceForm: FC<{
  languages: AppLanguage[];
  initial?: {
    id: string;
    name: string;
    contact: string | null;
    translations?: { appLanguageId: string; role: string }[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ languages, initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.personalReference");
  const utils = api.useUtils();
  const create = api.cv.createPersonalReference.useMutation();
  const update = api.cv.updatePersonalReference.useMutation();
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
        name: z.string().min(1, t("nameRequired")),
        contact: z.string(),
        role: textTranslationMapSchema(primaryLang?.id, t("role")),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<PersonalReferenceInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? "",
      contact: initial?.contact ?? "",
      role: initial?.translations
        ? textTranslationMapFromRows(
            languages,
            initial.translations,
            (row) => row.role,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

  const isNonPrimary = activeLangId !== primaryLang?.id;
  const watchedRoles = useWatch({ control: form.control, name: "role" });

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const roleText = watchedRoles?.[lang.id]?.text?.trim();
      const hasContent = Boolean(roleText);

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
  }, [languages, watchedRoles, primaryLang?.id]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress && !watchedRoles?.[activeLangId]?.text?.trim()) {
    missingItems.push(t("role"));
  }

  const primaryRole = watchedRoles?.[primaryLang?.id ?? ""]?.text;

  const handleSubmit = useCallback(
    (input: PersonalReferenceInput) => {
      startTransition(async () => {
        try {
          const payload = {
            name: input.name.trim(),
            contact: input.contact.trim() || null,
            role: input.role,
          };
          if (initial?.id) {
            await update.mutateAsync({ id: initial.id, ...payload });
          } else {
            await create.mutateAsync(payload);
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
        id="cv-personal-reference-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormContent>
          <FormSection title={t("details")}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem
                  label={t("name")}
                  inputId="cv-personal-reference-name"
                >
                  <Input {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem
                  label={t("contact")}
                  inputId="cv-personal-reference-contact"
                  description={t("contactHint")}
                >
                  <Input {...field} placeholder={t("contactPlaceholder")} />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={t("role")}>
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
              {isNonPrimary && showOriginal && primaryRole ? (
                <ReferenceSnippet
                  content={primaryRole}
                  label={t("role")}
                  onCopy={() =>
                    form.setValue(`role.${activeLangId}.text`, primaryRole, {
                      shouldDirty: true,
                    })
                  }
                />
              ) : null}

              <FormField
                control={form.control}
                name={`role.${activeLangId}.text`}
                render={({ field }) => (
                  <FormItem
                    label={t("role")}
                    inputId={`cv-personal-reference-role-${activeLangId}`}
                  >
                    <Input {...field} placeholder={t("rolePlaceholder")} />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        </FormContent>
        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
          submitId="cv-personal-reference-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};

export default PersonalReferenceForm;
