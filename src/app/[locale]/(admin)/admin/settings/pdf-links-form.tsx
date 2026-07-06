"use client";

import { useState, type FormEvent } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import { locales, localsDisplay } from "@/i18n/config";

interface PdfLinksFormProps {
  initialLinks: Record<string, string>;
}

const PdfLinksForm: FC<PdfLinksFormProps> = ({ initialLinks }) => {
  const t = useTranslations("admin.settings");

  // Local state for all fields
  const [links, setLinks] = useState<Record<string, string>>(
    locales.reduce(
      (acc, locale) => {
        acc[locale] = initialLinks[locale] || "";
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const upsertPdfLink = api.cv.upsertPdfLink.useMutation();
  const deletePdfLink = api.cv.deletePdfLink.useMutation();
  const utils = api.useUtils();

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    try {
      for (const locale of locales) {
        const url = links[locale];
        if (url && url.trim() !== "") {
          await upsertPdfLink.mutateAsync({
            locale,
            url: url.trim(),
          });
        } else if (initialLinks[locale] && (!url || url.trim() === "")) {
          // It was removed
          await deletePdfLink.mutateAsync({ locale });
        }
      }
      await utils.cv.getPdfLinks.invalidate();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-card flex scroll-mt-24 flex-col gap-5 rounded-xl p-6 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          PDF Resumes (Multi-language)
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Provide separate PDF links for each language. When visitors view your
          portfolio in a specific language, they will download the corresponding
          PDF.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {locales.map((locale) => (
          <div key={locale} className="flex flex-col gap-2">
            <label className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>{localsDisplay[locale]}</span>
              <span className="rounded border border-gray-100 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-gray-400 uppercase">
                {locale}
              </span>
            </label>
            <input
              type="url"
              placeholder={`https://example.com/resume-${locale}.pdf`}
              value={links[locale]}
              onChange={(e) => setLinks({ ...links, [locale]: e.target.value })}
              className="bg-card focus:border-primary-600 focus:ring-primary-600/20 w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:ring-2 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-primary-700 hover:bg-primary-800 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? t("saving") : t("save")}
        </button>
        {success && (
          <span className="text-sm font-medium text-green-600">
            Saved successfully!
          </span>
        )}
      </div>
    </form>
  );
};

export default PdfLinksForm;
