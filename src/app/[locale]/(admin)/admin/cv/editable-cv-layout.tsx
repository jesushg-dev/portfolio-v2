"use client";

import { useState } from "react";
import type { FC, ReactNode } from "react";
import type { useTranslations } from "next-intl";
import { FaEdit } from "react-icons/fa";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CvContextProvider } from "@/hoc/cv-context-provider";
import type { Locale as AppLocale } from "@/i18n/config";
import { CvEditorLocaleProvider } from "@/components/admin/shared/cv-editor-locale-context";
import CvLanguageTabs from "@/components/admin/shared/cv/cv-language-tabs";
import { FollowerPointerCard } from "@/components/ui/following-pointer";

// Display Components
import HeaderCv from "@/components/curriculum-vitae/header-cv";
import ContactMe from "@/components/curriculum-vitae/contact-me";
import Education from "@/components/curriculum-vitae/education";
import Languages from "@/components/curriculum-vitae/languages";
import TechnicalSkills from "@/components/curriculum-vitae/technical-skills";
import Experience from "@/components/curriculum-vitae/experiences";
import SoftSkills from "@/components/curriculum-vitae/soft-skills";
import AdditionalInformation from "@/components/curriculum-vitae/additional-information";

// Form Components
import AboutForm from "@/features/cv/components/about-form";
import ContactsList from "@/features/cv/components/contacts-list";
import EducationsList from "@/features/cv/components/educations-list";
import ExperiencesList from "@/features/cv/components/experiences-list";
import HeaderForm from "@/features/cv/components/header-form";
import LanguagesList from "@/features/cv/components/languages-list";
import SkillsList from "@/features/cv/components/skills-list";
import AdditionalList from "@/features/cv/components/additional-list";
import SoftSkillsList from "@/features/cv/components/soft-skills-list";

import type { CvData } from "@/components/curriculum-vitae/types";
import type {
  CvHeader,
  Profile,
  CvContact,
  CvEducation,
  CvLanguage,
  CvTechnicalSkill,
  CvSoftSkill,
  CvAdditionalInfo,
} from "@prisma/client";

type SectionType =
  | "header"
  | "contacts"
  | "education"
  | "languages"
  | "skills"
  | "about"
  | "experience"
  | "soft-skills"
  | "additional";

type CvTranslator = ReturnType<typeof useTranslations<"admin.cv">>;

interface ICvEditableLayoutProps {
  data: {
    header: CvHeader | null;
    profile: Profile | null;
    contacts: CvContact[];
    educations: CvEducation[];
    languages: CvLanguage[];
    technicalSkills: CvTechnicalSkill[];
    experiences: CvData["experiences"];
    softSkills: CvSoftSkill[];
    additionalInformation: CvAdditionalInfo[];
  };
  aboutMeText: string | null;
  currentLocale: AppLocale;
  defaultLocale: AppLocale;
  t: CvTranslator;
}

const EditableSection: FC<{
  id: SectionType;
  title: string;
  onClick: () => void;
  children: ReactNode;
  isEmpty?: boolean;
  t: CvTranslator;
}> = ({ id, title, onClick, children, isEmpty = false, t }) => {
  return (
    <FollowerPointerCard title={`${t("edit")} ${title}`}>
      <div
        id={id}
        className="group hover:border-primary-500/50 hover:bg-muted/10 relative -m-2 scroll-mt-32 rounded-xl border border-transparent p-2 transition-colors"
      >
        <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onClick}
            className="bg-primary-600 hover:bg-primary-700 flex cursor-none items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors"
          >
            <FaEdit /> {t("edit")} {title}
          </button>
        </div>
        {isEmpty ? (
          <div
            className="border-muted-foreground/30 bg-muted/20 text-muted-foreground hover:border-primary-500/50 hover:bg-muted/40 hover:text-primary-600 flex h-24 w-full cursor-none flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
            onClick={onClick}
          >
            <p className="text-sm font-medium">
              {t("empty")} {title}
            </p>
            <p className="text-xs opacity-70">{t("clickToAdd")}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </FollowerPointerCard>
  );
};

const EditableCvLayout: FC<ICvEditableLayoutProps> = ({
  data,
  aboutMeText,
  currentLocale,
  defaultLocale,
  t,
}) => {
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);

  const handleClose = (open: boolean) => {
    if (!open) setActiveSection(null);
  };

  const getModalTitle = (section: SectionType) => {
    switch (section) {
      case "header":
        return t("headerSection");
      case "contacts":
        return t("sections.contact");
      case "education":
        return t("sections.education");
      case "languages":
        return t("sections.languages");
      case "skills":
        return t("sections.technicalSkills");
      case "about":
        return t("sections.aboutMe");
      case "experience":
        return t("sections.experience");
      case "soft-skills":
        return t("sections.personalSkills");
      case "additional":
        return t("sections.additionalInformation");
      default:
        return "";
    }
  };

  return (
    <div className="relative">
      <CvContextProvider>
        <EditableSection
          id="header"
          title={t("headerSection")}
          onClick={() => setActiveSection("header")}
          isEmpty={!data.header}
          t={t}
        >
          <HeaderCv
            header={data.header}
            fallbackName={data.profile?.displayName ?? null}
            locale={currentLocale}
            defaultLocale={defaultLocale}
          />
        </EditableSection>

        <div className="bg-card grid grid-cols-1 p-5 pb-10 sm:grid-cols-9">
          <div className="flex flex-col gap-6 sm:col-span-3">
            <EditableSection
              id="contacts"
              title={t("sections.contact")}
              onClick={() => setActiveSection("contacts")}
              isEmpty={data.contacts.length === 0}
              t={t}
            >
              <ContactMe
                contacts={data.contacts}
                locale={currentLocale}
                defaultLocale={defaultLocale}
              />
            </EditableSection>

            <EditableSection
              id="education"
              title={t("sections.education")}
              onClick={() => setActiveSection("education")}
              isEmpty={data.educations.length === 0}
              t={t}
            >
              <Education
                educations={data.educations}
                locale={currentLocale}
                defaultLocale={defaultLocale}
              />
            </EditableSection>

            <EditableSection
              id="languages"
              title={t("sections.languages")}
              onClick={() => setActiveSection("languages")}
              isEmpty={data.languages.length === 0}
              t={t}
            >
              <Languages
                languages={data.languages}
                locale={currentLocale}
                defaultLocale={defaultLocale}
              />
            </EditableSection>

            <EditableSection
              id="skills"
              title={t("sections.technicalSkills")}
              onClick={() => setActiveSection("skills")}
              isEmpty={data.technicalSkills.length === 0}
              t={t}
            >
              <TechnicalSkills technicalSkills={data.technicalSkills} />
            </EditableSection>
          </div>

          <div className="col-span-1 hidden w-full justify-center sm:flex">
            <div className="border-border h-full w-[1px] border-r" />
          </div>

          <div className="flex flex-col gap-6 sm:col-span-5">
            <EditableSection
              id="about"
              title={t("sections.aboutMe")}
              onClick={() => setActiveSection("about")}
              isEmpty={!aboutMeText}
              t={t}
            >
              <div className="mb-4">
                <h5 className="text-primary mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
                  {t("sections.aboutMe")}
                </h5>
                <h3 className="text-foreground text-xs">{aboutMeText}</h3>
              </div>
            </EditableSection>

            <EditableSection
              id="experience"
              title={t("sections.experience")}
              onClick={() => setActiveSection("experience")}
              isEmpty={data.experiences.length === 0}
              t={t}
            >
              <Experience
                experiences={data.experiences}
                locale={currentLocale}
                defaultLocale={defaultLocale}
              />
            </EditableSection>

            <EditableSection
              id="soft-skills"
              title={t("sections.personalSkills")}
              onClick={() => setActiveSection("soft-skills")}
              isEmpty={data.softSkills.length === 0}
              t={t}
            >
              <SoftSkills
                softSkills={data.softSkills}
                locale={currentLocale}
                defaultLocale={defaultLocale}
              />
            </EditableSection>

            <EditableSection
              id="additional"
              title={t("sections.additionalInformation")}
              onClick={() => setActiveSection("additional")}
              isEmpty={data.additionalInformation.length === 0}
              t={t}
            >
              <AdditionalInformation
                additionalInformation={data.additionalInformation}
                locale={currentLocale}
                defaultLocale={defaultLocale}
              />
            </EditableSection>
          </div>
        </div>
      </CvContextProvider>

      <Dialog open={activeSection !== null} onOpenChange={handleClose}>
        <DialogContent className="max-h-[85vh] w-full max-w-5xl overflow-y-auto">
          <CvEditorLocaleProvider defaultLocale={defaultLocale}>
            <DialogHeader className="border-border flex flex-row items-center justify-between border-b pb-3">
              <DialogTitle className="text-lg">
                {activeSection ? getModalTitle(activeSection) : ""}
              </DialogTitle>
              {(activeSection === "about" || activeSection === "header") && (
                <CvLanguageTabs />
              )}
            </DialogHeader>

            <div className="mt-4">
              {activeSection === "header" && <HeaderForm />}
              {activeSection === "contacts" && <ContactsList />}
              {activeSection === "education" && <EducationsList />}
              {activeSection === "languages" && <LanguagesList />}
              {activeSection === "skills" && <SkillsList />}
              {activeSection === "about" && <AboutForm />}
              {activeSection === "experience" && <ExperiencesList />}
              {activeSection === "soft-skills" && <SoftSkillsList />}
              {activeSection === "additional" && <AdditionalList />}
            </div>
          </CvEditorLocaleProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditableCvLayout;
