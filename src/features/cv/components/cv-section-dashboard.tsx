"use client";

import { useMemo, useState } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";
import { User, FileText, Image as ImageIcon } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { FormSheetContent } from "@/components/shared/form-sheet-content";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import type { Locale } from "@/i18n/config";
import type { AppLanguage } from "@prisma/client";
import { api } from "@/trpc/react";

import { CvTranslationBadges } from "./cv-translation-badges";
import { CvEditorSkeleton } from "./cv-editor-skeleton";

// Form components
import { HeaderForm } from "./header-form";
import { AboutForm } from "./about-form";
import { ContactForm } from "./contact-form";
import { EducationForm } from "./education-form";
import { LanguageForm } from "./language-form";
import { SkillForm } from "./skill-form";
import { ExperienceForm } from "./experience-form";
import { SoftSkillForm } from "./soft-skill-form";
import { AdditionalForm } from "./additional-form";
import { PersonalReferenceForm } from "./personal-reference-form";

// List components
import { ContactsList } from "./contacts-list";
import { EducationsList } from "./educations-list";
import { LanguagesList } from "./languages-list";
import { SkillsList } from "./skills-list";
import { ExperiencesList } from "./experiences-list";
import { SoftSkillsList } from "./soft-skills-list";
import { AdditionalList } from "./additional-list";
import { PersonalReferencesList } from "./personal-references-list";

export type CvSectionId =
  | "header"
  | "contact"
  | "edu"
  | "langs"
  | "tech"
  | "about"
  | "exp"
  | "soft"
  | "extra"
  | "refs";

type CvSectionKey =
  | "cvHeader"
  | "contact"
  | "education"
  | "languages"
  | "technicalSkills"
  | "aboutMe"
  | "experience"
  | "personalSkills"
  | "additionalInformation"
  | "personalReferences";

interface SectionMeta {
  id: CvSectionId;
  labelKey: CvSectionKey;
  defaultLabel: string;
  single: boolean;
}

const SECTIONS_CONFIG: SectionMeta[] = [
  { id: "header", labelKey: "cvHeader", defaultLabel: "Header", single: true },
  {
    id: "contact",
    labelKey: "contact",
    defaultLabel: "Contact",
    single: false,
  },
  {
    id: "edu",
    labelKey: "education",
    defaultLabel: "Education",
    single: false,
  },
  {
    id: "langs",
    labelKey: "languages",
    defaultLabel: "Languages",
    single: false,
  },
  {
    id: "tech",
    labelKey: "technicalSkills",
    defaultLabel: "Technical Skills",
    single: false,
  },
  { id: "about", labelKey: "aboutMe", defaultLabel: "About Me", single: true },
  {
    id: "exp",
    labelKey: "experience",
    defaultLabel: "Experience",
    single: false,
  },
  {
    id: "soft",
    labelKey: "personalSkills",
    defaultLabel: "Soft Skills",
    single: false,
  },
  {
    id: "extra",
    labelKey: "additionalInformation",
    defaultLabel: "Additional Info",
    single: false,
  },
  {
    id: "refs",
    labelKey: "personalReferences",
    defaultLabel: "References",
    single: false,
  },
];

export interface CvSectionDashboardProps {
  languages: AppLanguage[];
  displayLocale: Locale;
}

export const CvSectionDashboard: FC<CvSectionDashboardProps> = ({
  languages,
  displayLocale,
}) => {
  const t = useTranslations("admin.cv");
  const [activeSection, setActiveSection] = useState<CvSectionId>("header");
  const [activeDrawer, setActiveDrawer] = useState<{
    section: CvSectionId;
    id?: string;
  } | null>(null);

  const { data, isLoading } = api.cv.getMine.useQuery();

  const field = useMemo(
    () => createLocalizedFieldResolver(languages, displayLocale),
    [languages, displayLocale],
  );

  const counts: Record<CvSectionId, number> = useMemo(() => {
    return {
      header: data?.header ? 1 : 0,
      contact: data?.contacts.length ?? 0,
      edu: data?.educations.length ?? 0,
      langs: data?.languages.length ?? 0,
      tech: data?.technicalSkills.length ?? 0,
      about: data?.aboutMe ? 1 : 0,
      exp: data?.experiences.length ?? 0,
      soft: data?.softSkills.length ?? 0,
      extra: data?.additionalInformation.length ?? 0,
      refs: data?.personalReferences.length ?? 0,
    };
  }, [data]);

  const handleOpenDrawer = (section: CvSectionId, id?: string) => {
    setActiveDrawer({ section, id });
  };

  const handleCloseDrawer = () => {
    setActiveDrawer(null);
  };

  const drawerMeta = useMemo(() => {
    if (!activeDrawer)
      return { title: "", subtitle: undefined as string | undefined };
    const { section, id } = activeDrawer;
    const isEdit = Boolean(id);

    switch (section) {
      case "header":
        return {
          title: t("actionTitles.editHeader"),
          subtitle: data?.header?.fullName ?? undefined,
        };
      case "about":
        return {
          title: t("actionTitles.editAbout"),
          subtitle: t("sections.aboutMe"),
        };
      case "contact": {
        const item = id ? data?.contacts.find((c) => c.id === id) : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editContact")
            : t("actionTitles.newContact"),
          subtitle: item?.value ?? undefined,
        };
      }
      case "edu": {
        const item = id ? data?.educations.find((e) => e.id === id) : undefined;
        const degree = item
          ? field(item.translations, "degreeName")
          : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editEducation")
            : t("actionTitles.newEducation"),
          subtitle: degree ?? item?.institution ?? undefined,
        };
      }
      case "langs": {
        const item = id ? data?.languages.find((l) => l.id === id) : undefined;
        const name = item ? field(item.translations, "name") : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editLanguage")
            : t("actionTitles.newLanguage"),
          subtitle: name ?? undefined,
        };
      }
      case "tech": {
        const item = id
          ? data?.technicalSkills.find((s) => s.id === id)
          : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editSkillGroup")
            : t("actionTitles.newSkillGroup"),
          subtitle: item?.category ?? undefined,
        };
      }
      case "exp": {
        const item = id
          ? data?.experiences.find((e) => e.id === id)
          : undefined;
        const role = item ? field(item.translations, "role") : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editExperience")
            : t("actionTitles.newExperience"),
          subtitle: role ?? item?.company ?? undefined,
        };
      }
      case "soft": {
        const item = id ? data?.softSkills.find((s) => s.id === id) : undefined;
        const name = item ? field(item.translations, "name") : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editSoftSkill")
            : t("actionTitles.newSoftSkill"),
          subtitle: name ?? undefined,
        };
      }
      case "extra": {
        const item = id
          ? data?.additionalInformation.find((a) => a.id === id)
          : undefined;
        const text = item ? field(item.translations, "text") : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editAdditional")
            : t("actionTitles.newAdditional"),
          subtitle: text
            ? text.length > 60
              ? `${text.slice(0, 60)}…`
              : text
            : undefined,
        };
      }
      case "refs": {
        const item = id
          ? data?.personalReferences.find((r) => r.id === id)
          : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editReference")
            : t("actionTitles.newReference"),
          subtitle: item?.name ?? undefined,
        };
      }
      default:
        return { title: "", subtitle: undefined };
    }
  }, [activeDrawer, data, field, t]);

  if (isLoading || !data) {
    return <CvEditorSkeleton />;
  }

  const header = data.header;
  const aboutMe = data.aboutMe;

  return (
    <div className="border-border bg-card w-full max-w-full min-w-0 rounded-xl border shadow-sm">
      {/* Top Section Tabs Bar */}
      <div className="border-border bg-muted/30 min-w-0 overflow-hidden rounded-t-xl border-b px-3">
        <Tabs
          value={activeSection}
          onValueChange={(val) => setActiveSection(val as CvSectionId)}
        >
          <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
            <TabsList
              variant="line"
              className="flex min-h-12 w-max min-w-full justify-start gap-1"
            >
              {SECTIONS_CONFIG.map((sec) => {
                const label = t(`sections.${sec.labelKey}`) || sec.defaultLabel;
                const count = counts[sec.id];

                return (
                  <TabsTrigger
                    key={sec.id}
                    value={sec.id}
                    className="flex shrink-0 items-center gap-2 px-3 py-2 text-xs font-medium sm:text-sm"
                  >
                    <span>{label}</span>
                    {!sec.single ? (
                      <span className="bg-muted/70 text-foreground/80 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums">
                        {count}
                      </span>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Active Section Content Pane */}
      <div className="min-w-0 space-y-4 p-4 sm:p-6">
        {/* SECTION: HEADER */}
        {activeSection === "header" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs sm:text-sm">
                {t("singleEntryHint")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenDrawer("header")}
                className="text-xs"
              >
                {t("edit")} {t("sections.cvHeader")}
              </Button>
            </div>

            {header ? (
              <div className="border-border/80 bg-card/60 hover:border-border hover:bg-card flex flex-col justify-between gap-4 rounded-xl border p-4 shadow-2xs transition-colors sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="border-border bg-muted/40 relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                    {header.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={header.photoUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <User className="text-muted-foreground/50 size-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-semibold">
                      {header.fullName}
                    </h3>
                    <p className="text-muted-foreground text-xs font-medium">
                      {field(header.translations, "degree") || "(No degree)"}
                    </p>
                    {header.backgroundImageUrl ? (
                      <p className="text-muted-foreground/75 mt-0.5 flex items-center gap-1 text-[0.6875rem]">
                        <ImageIcon className="size-3" /> Background image
                        configured
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CvTranslationBadges
                    languages={languages}
                    translations={header.translations}
                    requiredKeys={["degree"]}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDrawer("header")}
                    className="h-8 text-xs font-medium"
                  >
                    {t("edit")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-border bg-card/40 flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  {t("singleEntryHint")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDrawer("header")}
                  className="mt-3 text-xs"
                >
                  {t("actionTitles.editHeader")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: ABOUT ME */}
        {activeSection === "about" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs sm:text-sm">
                {t("singleEntryHint")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenDrawer("about")}
                className="text-xs"
              >
                {t("edit")} {t("sections.aboutMe")}
              </Button>
            </div>

            {aboutMe ? (
              <div className="border-border/80 bg-card/60 hover:border-border hover:bg-card flex flex-col justify-between gap-4 rounded-xl border p-4 shadow-2xs transition-colors sm:flex-row sm:items-center">
                <div className="flex items-start gap-3.5">
                  <div className="border-border bg-muted/40 mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg border">
                    <FileText className="text-muted-foreground/60 size-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-semibold">
                      {t("sections.aboutMe")}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {field(aboutMe.translations, "aboutMe") ||
                        "(No biography text)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CvTranslationBadges
                    languages={languages}
                    translations={aboutMe.translations}
                    requiredKeys={["aboutMe"]}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDrawer("about")}
                    className="h-8 text-xs font-medium"
                  >
                    {t("edit")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-border bg-card/40 flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  {t("singleEntryHint")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDrawer("about")}
                  className="mt-3 text-xs"
                >
                  {t("actionTitles.editAbout")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: CONTACT */}
        {activeSection === "contact" && (
          <ContactsList
            languages={languages}
            displayLocale={displayLocale}
            onEditItem={(id) => handleOpenDrawer("contact", id)}
            onAddNew={() => handleOpenDrawer("contact")}
          />
        )}

        {/* SECTION: EDUCATION */}
        {activeSection === "edu" && (
          <EducationsList
            languages={languages}
            displayLocale={displayLocale}
            onEditItem={(id) => handleOpenDrawer("edu", id)}
            onAddNew={() => handleOpenDrawer("edu")}
          />
        )}

        {/* SECTION: LANGUAGES */}
        {activeSection === "langs" && (
          <LanguagesList
            languages={languages}
            displayLocale={displayLocale}
            onEditItem={(id) => handleOpenDrawer("langs", id)}
            onAddNew={() => handleOpenDrawer("langs")}
          />
        )}

        {/* SECTION: TECHNICAL SKILLS */}
        {activeSection === "tech" && (
          <SkillsList
            onEditItem={(id) => handleOpenDrawer("tech", id)}
            onAddNew={() => handleOpenDrawer("tech")}
          />
        )}

        {/* SECTION: EXPERIENCE */}
        {activeSection === "exp" && (
          <ExperiencesList
            languages={languages}
            displayLocale={displayLocale}
            onEditItem={(id) => handleOpenDrawer("exp", id)}
            onAddNew={() => handleOpenDrawer("exp")}
          />
        )}

        {/* SECTION: SOFT SKILLS */}
        {activeSection === "soft" && (
          <SoftSkillsList
            languages={languages}
            displayLocale={displayLocale}
            onEditItem={(id) => handleOpenDrawer("soft", id)}
            onAddNew={() => handleOpenDrawer("soft")}
          />
        )}

        {/* SECTION: ADDITIONAL INFO */}
        {activeSection === "extra" && (
          <AdditionalList
            languages={languages}
            displayLocale={displayLocale}
            onEditItem={(id) => handleOpenDrawer("extra", id)}
            onAddNew={() => handleOpenDrawer("extra")}
          />
        )}

        {/* SECTION: PERSONAL REFERENCES */}
        {activeSection === "refs" && (
          <PersonalReferencesList
            languages={languages}
            displayLocale={displayLocale}
            onEditItem={(id) => handleOpenDrawer("refs", id)}
            onAddNew={() => handleOpenDrawer("refs")}
          />
        )}
      </div>

      {/* Global Slide-Over Sheet Drawer for Editing Forms */}
      <Sheet open={activeDrawer !== null} onOpenChange={handleCloseDrawer}>
        <FormSheetContent
          id="cv-section-editor-sheet"
          title={drawerMeta.title}
          description={drawerMeta.subtitle}
          bodyScroll
        >
          {activeDrawer?.section === "header" && (
            <HeaderForm
              languages={languages}
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "about" && (
            <AboutForm
              languages={languages}
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "contact" && (
            <ContactForm
              languages={languages}
              initial={
                activeDrawer.id
                  ? data.contacts.find((c) => c.id === activeDrawer.id)
                  : undefined
              }
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "edu" && (
            <EducationForm
              languages={languages}
              initial={
                activeDrawer.id
                  ? data.educations.find((e) => e.id === activeDrawer.id)
                  : undefined
              }
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "langs" && (
            <LanguageForm
              languages={languages}
              initial={
                activeDrawer.id
                  ? data.languages.find((l) => l.id === activeDrawer.id)
                  : undefined
              }
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "tech" && (
            <SkillForm
              initial={
                activeDrawer.id
                  ? data.technicalSkills.find((s) => s.id === activeDrawer.id)
                  : undefined
              }
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "exp" && (
            <ExperienceForm
              languages={languages}
              initial={
                activeDrawer.id
                  ? data.experiences.find((e) => e.id === activeDrawer.id)
                  : undefined
              }
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "soft" && (
            <SoftSkillForm
              languages={languages}
              initial={
                activeDrawer.id
                  ? data.softSkills.find((s) => s.id === activeDrawer.id)
                  : undefined
              }
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "extra" && (
            <AdditionalForm
              languages={languages}
              initial={
                activeDrawer.id
                  ? data.additionalInformation.find(
                      (a) => a.id === activeDrawer.id,
                    )
                  : undefined
              }
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}

          {activeDrawer?.section === "refs" && (
            <PersonalReferenceForm
              languages={languages}
              initial={
                activeDrawer.id
                  ? data.personalReferences.find(
                      (r) => r.id === activeDrawer.id,
                    )
                  : undefined
              }
              onCancel={handleCloseDrawer}
              onSuccess={handleCloseDrawer}
            />
          )}
        </FormSheetContent>
      </Sheet>
    </div>
  );
};

export default CvSectionDashboard;
