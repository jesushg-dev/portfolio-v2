"use client";

import { useState, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { api } from "@/trpc/react";
import { LocalizedTextSchema } from "@/lib/i18n/localized";
import {
  FormRoot,
  FormContent,
  FormSection,
  FormItem,
  FormActions,
} from "@/components/shared/form-root";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";

// ---------------------------------------------------------------------------
// App locales as "languages" array for GlobalLanguageSelector
// ---------------------------------------------------------------------------

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};

const APP_LANGUAGES = locales.map((loc) => ({
  id: loc,
  code: loc,
  name: LOCALE_NAMES[loc],
}));

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const formSchema = z.object({
  consoleCode: LocalizedTextSchema,
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractLocalizedConsoleCode(raw: unknown): {
  default: string;
  translations?: Record<string, string>;
} {
  const fallback = {
    default:
      "const dev = {\n  name: 'Jesús',\n  roles: ['Developer', 'Engineer']\n};",
  };

  if (!raw || typeof raw !== "object") return fallback;

  const obj = raw as Record<string, unknown>;
  const cc = obj.consoleCode;

  if (!cc) return fallback;

  if (typeof cc === "string") return { default: cc };

  if (typeof cc === "object") {
    const ccObj = cc as Record<string, unknown>;
    return {
      default: typeof ccObj.default === "string" ? ccObj.default : "",
      translations:
        typeof ccObj.translations === "object" && ccObj.translations !== null
          ? (ccObj.translations as Record<string, string>)
          : undefined,
    };
  }

  return fallback;
}

function getLocaleValue(
  field: { default: string; translations?: Record<string, string> },
  activeLang: Locale,
  defaultLocale: Locale,
): string {
  if (activeLang === defaultLocale) return field.default;
  return field.translations?.[activeLang] ?? "";
}

function setLocaleValue(
  field: { default: string; translations?: Record<string, string> },
  activeLang: Locale,
  defaultLocale: Locale,
  text: string,
): { default: string; translations?: Record<string, string> } {
  if (activeLang === defaultLocale) {
    return { ...field, default: text };
  }
  return {
    ...field,
    translations: { ...field.translations, [activeLang]: text },
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConsoleFormProps {
  locale: Locale;
  initial?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConsoleForm({ locale, initial }: ConsoleFormProps) {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      consoleCode: extractLocalizedConsoleCode(initial),
    },
  });

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Locale>(locale);

  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();

  const handleSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          // Preserve the aboutMe text fields (default / translations) that
          // live in the same DB row — read them from the initial prop so we
          // don't overwrite them with empty strings.
          const defaultText =
            typeof initial?.default === "string" ? initial.default : "";
          const translationsText =
            typeof initial?.translations === "object" &&
            initial.translations !== null
              ? (initial.translations as Record<string, string>)
              : undefined;

          const payload = {
            default: defaultText,
            translations: translationsText,
            consoleCode: values.consoleCode,
          };

          await upsertAboutMe.mutateAsync({ aboutMe: payload });
          await utils.cv.getMine.invalidate();
          toast.success(t("savedSuccess") || "Saved");
        } catch (err) {
          setServerError(err instanceof Error ? err.message : "Save failed");
        }
      });
    },
    [initial, upsertAboutMe, utils, t],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <GlobalLanguageSelector
          languages={APP_LANGUAGES}
          activeLangId={activeLang}
          onLangChange={(id) => setActiveLang(id as Locale)}
        />

        <FormContent error={serverError}>
          <FormSection
            title={t("heroConsoleTitle")}
            description={t("heroConsoleSubtitle")}
          >
            <FormField
              control={form.control}
              name="consoleCode"
              render={({ field }) => (
                <FormItem
                  label={`${t("heroConsoleTitle")} (${LOCALE_NAMES[activeLang]})`}
                >
                  <FormControl>
                    <Textarea
                      rows={12}
                      className="font-mono text-sm"
                      placeholder="const dev = ..."
                      value={getLocaleValue(field.value, activeLang, locale)}
                      onChange={(e) =>
                        field.onChange(
                          setLocaleValue(
                            field.value,
                            activeLang,
                            locale,
                            e.target.value,
                          ),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending}
          title={isPending ? t("saving") : t("save")}
        />
      </FormRoot>
    </Form>
  );
}
