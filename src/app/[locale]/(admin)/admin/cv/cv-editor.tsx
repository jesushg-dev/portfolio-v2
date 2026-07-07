"use client";

import { useMemo, useState } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

import LocaleSegment from "@/components/admin/shared/locale-segment";
import { localsDisplay, type Locale } from "@/i18n/config";
import { api } from "@/trpc/react";
import CvPreview from "@/components/curriculum-vitae/cv-preview";
import EditableCvLayout from "./editable-cv-layout";
import { getLocalizedText } from "@/lib/i18n/localized";
import { CvEditorSkeleton } from "@/features/cv/components/cv-editor-skeleton";
import { CvPageFrame } from "@/features/cv/components/cv-page-frame";

const SECTION_LINKS = [
  { id: "header", labelKey: "cvHeader" as const },
  { id: "contacts", labelKey: "contact" as const },
  { id: "education", labelKey: "education" as const },
  { id: "languages", labelKey: "languages" as const },
  { id: "skills", labelKey: "technicalSkills" as const },
  { id: "about", labelKey: "aboutMe" as const },
  { id: "experience", labelKey: "experience" as const },
  { id: "soft-skills", labelKey: "personalSkills" as const },
  { id: "additional", labelKey: "additionalInformation" as const },
] as const;

type EditorView = "edit" | "preview";

type CvTranslator = ReturnType<typeof useTranslations<"admin.cv">>;

const CvEditorContent: FC<{ defaultLocale: Locale; t: CvTranslator }> = ({
  defaultLocale,
  t,
}) => {
  const { data } = api.cv.getMine.useQuery();
  const [view, setView] = useState<EditorView>("edit");
  const [previewLocaleOverride, setPreviewLocaleOverride] =
    useState<Locale | null>(null);

  const previewLocale =
    previewLocaleOverride ??
    (data?.profile?.defaultLocale as Locale) ??
    defaultLocale;

  const previewData = useMemo(() => {
    if (!data) return null;
    return {
      profile: data.profile,
      header: data.header,
      contacts: data.contacts,
      educations: data.educations,
      languages: data.languages,
      technicalSkills: data.technicalSkills,
      experiences: data.experiences,
      softSkills: data.softSkills,
      additionalInformation: data.additionalInformation,
    };
  }, [data]);

  const aboutMePreview = getLocalizedText(
    data?.aboutMe?.aboutMe,
    previewLocale,
    defaultLocale,
  );

  if (!data?.profile) return null;

  return (
    <>
      <div className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 mb-6 rounded-xl px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="bg-muted/50 inline-flex rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setView("edit")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                view === "edit"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("edit")}
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                view === "preview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("preview")}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-muted-foreground text-xs font-medium">
              {t("previewLanguage")}
            </span>
            <LocaleSegment
              value={previewLocale}
              onChange={setPreviewLocaleOverride}
              defaultLocale={defaultLocale}
            />
          </div>
        </div>

        {view === "edit" ? (
          <nav className="mt-3 flex gap-1 overflow-x-auto pt-3">
            {SECTION_LINKS.map((section) => {
              const label = t(`sections.${section.labelKey}`);
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  {label}
                </a>
              );
            })}
          </nav>
        ) : null}
      </div>

      {view === "preview" && previewData ? (
        <CvPageFrame
          hint={t("previewRefresh", {
            locale: localsDisplay[previewLocale],
          })}
        >
          <CvPreview
            data={previewData}
            aboutMeText={aboutMePreview}
            currentLocale={previewLocale}
            defaultLocale={defaultLocale}
          />
        </CvPageFrame>
      ) : (
        <CvPageFrame hint={t("editingBanner")}>
          <EditableCvLayout
            data={previewData!}
            aboutMeText={aboutMePreview}
            currentLocale={previewLocale}
            defaultLocale={defaultLocale}
            t={t}
          />
        </CvPageFrame>
      )}
    </>
  );
};

const CvEditor: FC = () => {
  const t = useTranslations("admin.cv");
  const { data, isLoading, isError } = api.cv.getMine.useQuery();
  const defaultLocale = (data?.profile?.defaultLocale as Locale) ?? "en";

  if (isLoading) {
    return <CvEditorSkeleton />;
  }

  if (isError || !data) {
    return (
      <p className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
        {t("loadError")}
      </p>
    );
  }

  if (!data.profile) {
    return (
      <div className="border-border bg-muted/40 rounded-xl border p-5">
        <p className="text-foreground text-sm">
          {t.rich("noProfile", {
            link: (chunks) => (
              <Link href="/admin/settings" className="font-medium underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <CvEditorContent defaultLocale={defaultLocale} t={t} />
    </div>
  );
};

export default CvEditor;
