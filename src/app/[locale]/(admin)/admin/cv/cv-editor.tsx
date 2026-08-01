"use client";

import { useCallback, useMemo, useState } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

import LocaleSegment from "@/components/admin/shared/locale-segment";
import { localsDisplay, type Locale } from "@/i18n/config";
import { useTabsKeyboard } from "@/hooks/use-tabs-keyboard";
import { api } from "@/trpc/react";
import CvPreview from "@/components/curriculum-vitae/cv-preview";
import EditableCvLayout from "./editable-cv-layout";
import { mapCvDataToLocalized } from "@/components/curriculum-vitae/types";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import { CvEditorSkeleton } from "@/features/cv/components/cv-editor-skeleton";
import { CvPageFrame } from "@/features/cv/components/cv-page-frame";
import { ResumeImportWorkflow } from "@/features/resume-engine/components/resume-import-workflow";

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

type EditorView = "edit" | "preview" | "import";

const VIEW_TABS: EditorView[] = ["edit", "preview", "import"];

export const CvEditor: FC<{ defaultLocale: Locale }> = ({ defaultLocale }) => {
  const t = useTranslations("admin.cv");
  const [view, setView] = useState<EditorView>("edit");
  const [previewLocale, setPreviewLocale] = useState<Locale>(defaultLocale);

  const { data, isLoading, isError } = api.cv.getMine.useQuery();
  const { data: languages = [] } = api.appLanguagesAdmin.getAll.useQuery();

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
      aboutMe: data.aboutMe,
      personalReferences: data.personalReferences,
    };
  }, [data]);

  const field = useMemo(
    () => createLocalizedFieldResolver(languages, previewLocale),
    [languages, previewLocale],
  );

  const aboutMePreview = field(data?.aboutMe?.translations, "aboutMe");

  const localizedPreviewData = useMemo(() => {
    if (!previewData) return null;
    return mapCvDataToLocalized(
      previewData,
      languages.map(({ id, code }) => ({ id, code })),
      previewLocale,
    );
  }, [previewData, languages, previewLocale]);

  const activeViewIndex = VIEW_TABS.indexOf(view);

  const handleViewTabChange = useCallback((index: number) => {
    const nextView = VIEW_TABS[index];
    if (nextView) setView(nextView);
  }, []);

  const onViewTabsKeyDown = useTabsKeyboard(
    VIEW_TABS.length,
    activeViewIndex,
    handleViewTabChange,
  );

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

      <div className="bg-card/95 supports-backdrop-filter:bg-card/80 sticky top-0 z-10 mb-6 rounded-xl px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label={t("viewTabsAria")}
            className="bg-muted/50 inline-flex rounded-lg p-0.5"
            onKeyDown={onViewTabsKeyDown}
          >
            <button
              id="cv-editor-edit"
              type="button"
              role="tab"
              aria-selected={view === "edit"}
              tabIndex={view === "edit" ? 0 : -1}
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
              id="cv-editor-preview"
              type="button"
              role="tab"
              aria-selected={view === "preview"}
              tabIndex={view === "preview" ? 0 : -1}
              onClick={() => setView("preview")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                view === "preview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("preview")}
            </button>
            <button
              id="cv-editor-import"
              type="button"
              role="tab"
              aria-selected={view === "import"}
              tabIndex={view === "import" ? 0 : -1}
              onClick={() => setView("import")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                view === "import"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("import")}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-muted-foreground text-xs font-medium">
              {t("previewLanguage")}
            </span>
            <LocaleSegment
              id="cv-preview-locale-tabs"
              buttonIdPrefix="cv-preview-locale"
              value={previewLocale}
              onChange={setPreviewLocale}
              defaultLocale={defaultLocale}
            />
          </div>
        </div>

        {view === "edit" ? (
          <nav
            aria-label={t("sectionNavAria")}
            className="mt-3 flex gap-1 overflow-x-auto pt-3"
          >
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
          <div id="cv-admin-preview">
            <CvPreview
              data={localizedPreviewData!}
              aboutMeText={aboutMePreview}
            />
          </div>
        </CvPageFrame>
      ) : view === "import" ? (
        <ResumeImportWorkflow onImported={() => setView("edit")} />
      ) : (
        <CvPageFrame hint={t("editingBanner")}>
          <EditableCvLayout
            data={previewData!}
            aboutMeText={aboutMePreview}
            currentLocale={previewLocale}
            defaultLocale={defaultLocale}
          />
        </CvPageFrame>
      )}
    </div>
  );
};

export default CvEditor;
