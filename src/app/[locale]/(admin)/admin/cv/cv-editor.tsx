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
import { mapCvDataToLocalized } from "@/components/curriculum-vitae/types";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import { CvEditorSkeleton } from "@/features/cv/components/cv-editor-skeleton";
import { CvPageFrame } from "@/features/cv/components/cv-page-frame";
import { resolveCvAboutPreviewText } from "@/features/cv/lib/resolve-cv-about-preview-text";
import { ResumeImportWorkflow } from "@/features/resume-engine/components/resume-import-workflow";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cvLayoutRegistry,
  DEFAULT_CV_LAYOUT_STYLE,
  type CvLayoutStyle,
} from "@/features/cv/lib/cv-layout-registry";

const SECTION_LINKS = [
  { id: "header", labelKey: "cvHeader" as const },
  { id: "contacts", labelKey: "contact" as const },
  { id: "about", labelKey: "aboutMe" as const },
  { id: "experience", labelKey: "experience" as const },
  { id: "skills", labelKey: "technicalSkills" as const },
  { id: "education", labelKey: "education" as const },
  { id: "languages", labelKey: "languages" as const },
  { id: "soft-skills", labelKey: "personalSkills" as const },
  { id: "additional", labelKey: "additionalInformation" as const },
  { id: "personal-references", labelKey: "personalReferences" as const },
] as const;

type EditorView = "visual" | "preview" | "import";

export const CvEditor: FC<{ defaultLocale: Locale }> = ({ defaultLocale }) => {
  const t = useTranslations("admin.cv");
  const [view, setView] = useState<EditorView>("visual");
  const [layoutStyle, setLayoutStyle] = useState<CvLayoutStyle>(
    DEFAULT_CV_LAYOUT_STYLE,
  );
  const [previewLocale, setPreviewLocale] = useState<Locale>(defaultLocale);

  const { data, isLoading, isError } = api.cv.getMine.useQuery();
  const { data: languages = [] } = api.appLanguagesAdmin.getAll.useQuery();

  const previewData = useMemo(() => {
    if (!data) return null;
    return {
      profile: data.profile,
      portfolioUrl: data.portfolioUrl,
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

  const aboutMePreview = resolveCvAboutPreviewText(
    field(data?.aboutMe?.translations, "aboutMe"),
  );

  const localizedPreviewData = useMemo(() => {
    if (!previewData) return null;
    return mapCvDataToLocalized(
      previewData,
      languages.map(({ id, code }) => ({ id, code })),
      previewLocale,
    );
  }, [previewData, languages, previewLocale]);

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
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <div className="border-border bg-card w-full max-w-full min-w-0 rounded-xl border shadow-sm">
        {/* Canonical tabs and section links */}
        <div className="border-border bg-muted/30 sticky top-0 z-20 space-y-3 rounded-t-xl border-b p-3 backdrop-blur md:top-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Canonical Line Tabs for View Switcher */}
            <Tabs
              className="w-full min-w-0 sm:w-auto sm:flex-1"
              value={view}
              onValueChange={(val) => setView(val as EditorView)}
            >
              <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
                <TabsList
                  variant="line"
                  className="min-h-12 w-max min-w-full justify-start"
                >
                  <TabsTrigger value="visual" className="text-sm">
                    {t("visualSheet")}
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-sm">
                    {t("preview")}
                  </TabsTrigger>
                  <TabsTrigger value="import" className="text-sm">
                    {t("import")}
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>

            <div className="flex flex-wrap items-center gap-4">
              {/* Scalable Layout Style Switcher (for visual/preview views) */}
              {view === "visual" || view === "preview" ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("layoutVersion")}
                  </span>
                  <Tabs
                    value={layoutStyle}
                    onValueChange={(val) =>
                      setLayoutStyle(val as CvLayoutStyle)
                    }
                  >
                    <TabsList variant="pill" className="h-8">
                      {cvLayoutRegistry.map((entry) => (
                        <TabsTrigger
                          key={entry.id}
                          value={entry.id}
                          className="px-2.5 py-1 text-xs"
                        >
                          {t(entry.labelKey)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              ) : null}

              {/* Language Selector */}
              <div className="flex items-center gap-2">
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
          </div>

          {/* Section Quick Jump Links (when in visual mode) */}
          {view === "visual" ? (
            <nav
              aria-label={t("sectionNavAria")}
              className="border-border/60 flex gap-1.5 overflow-x-auto border-t pt-3"
            >
              {SECTION_LINKS.map((section) => {
                const label = t(`sections.${section.labelKey}`);
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="min-w-0 p-4 sm:p-6">
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
                  locale={previewLocale}
                />
              </div>
            </CvPageFrame>
          ) : view === "import" ? (
            <ResumeImportWorkflow onImported={() => setView("visual")} />
          ) : (
            <CvPageFrame hint={t("editingBanner")}>
              <EditableCvLayout
                data={previewData!}
                aboutMeText={aboutMePreview}
                currentLocale={previewLocale}
                defaultLocale={defaultLocale}
                layoutStyle={layoutStyle}
              />
            </CvPageFrame>
          )}
        </div>
      </div>
    </div>
  );
};

export default CvEditor;
