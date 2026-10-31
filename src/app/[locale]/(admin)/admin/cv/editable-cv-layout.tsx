"use client";

import { useCallback, useMemo, useState } from "react";
import type { FC, KeyboardEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { FormSheetContent } from "@/components/shared/form-sheet-content";
import { CvContextProvider } from "@/hoc/cv-context-provider";
import {
  mapCvDataToLocalized,
  type LocalizedCvData,
} from "@/components/curriculum-vitae/types";
import { appendPortfolioWebsiteContact } from "@/lib/cv/append-portfolio-website-contact";
import type { Locale as AppLocale } from "@/i18n/config";
import { api } from "@/trpc/react";
import { FollowerPointerCard } from "@/components/ui/following-pointer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { CvLayoutStyle } from "@/features/cv/lib/cv-layout-registry";

// Display Components
import HeaderCv from "@/components/curriculum-vitae/header-cv";
import ContactMe from "@/components/curriculum-vitae/contact-me";
import Education from "@/components/curriculum-vitae/education";
import Languages from "@/components/curriculum-vitae/languages";
import TechnicalSkills from "@/components/curriculum-vitae/technical-skills";
import Experience from "@/components/curriculum-vitae/experiences";
import SoftSkills from "@/components/curriculum-vitae/soft-skills";
import AdditionalInformation from "@/components/curriculum-vitae/additional-information";
import PersonalReferences from "@/components/curriculum-vitae/personal-references";

// Form Components
import AboutForm from "@/features/cv/components/about-form";
import ContactsList from "@/features/cv/components/contacts-list";
import ContactForm from "@/features/cv/components/contact-form";
import EducationsList from "@/features/cv/components/educations-list";
import EducationForm from "@/features/cv/components/education-form";
import ExperiencesList from "@/features/cv/components/experiences-list";
import ExperienceForm from "@/features/cv/components/experience-form";
import HeaderForm from "@/features/cv/components/header-form";
import LanguagesList from "@/features/cv/components/languages-list";
import LanguageForm from "@/features/cv/components/language-form";
import SkillsList from "@/features/cv/components/skills-list";
import SkillForm from "@/features/cv/components/skill-form";
import AdditionalList from "@/features/cv/components/additional-list";
import AdditionalForm from "@/features/cv/components/additional-form";
import SoftSkillsList from "@/features/cv/components/soft-skills-list";
import SoftSkillForm from "@/features/cv/components/soft-skill-form";
import PersonalReferencesList from "@/features/cv/components/personal-references-list";
import PersonalReferenceForm from "@/features/cv/components/personal-reference-form";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";

import type { CvData } from "@/components/curriculum-vitae/types";

const FINE_HOVER_QUERY = "(hover: hover) and (pointer: fine)";

export type SectionType =
  | "header"
  | "contacts"
  | "education"
  | "languages"
  | "skills"
  | "about"
  | "experience"
  | "soft-skills"
  | "additional"
  | "personal-references";

type CvTranslator = ReturnType<typeof useTranslations<"admin.cv">>;

interface EditableSectionProps {
  id: SectionType;
  title: string;
  onClick: () => void;
  children: ReactNode;
  isEmpty?: boolean;
  t: CvTranslator;
  canHoverEdit: boolean;
  className?: string;
  emptyClassName?: string;
}

const EditableSection: FC<EditableSectionProps> = ({
  id,
  title,
  onClick,
  children,
  isEmpty = false,
  t,
  canHoverEdit,
  className,
  emptyClassName,
}) => {
  const editLabel = `${t("edit")} ${title}`;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onClick();
  };

  const section = (
    <div
      id={id}
      role="button"
      tabIndex={0}
      aria-label={editLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group hover:border-cv/40 relative -m-2 scroll-mt-32 rounded-xl border border-transparent p-2 transition-colors hover:bg-black/3",
        canHoverEdit ? "cursor-none" : "cursor-pointer",
        className,
      )}
    >
      <div
        className={cn(
          "absolute top-2 right-2 z-10 transition-opacity",
          canHoverEdit
            ? "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            : "opacity-100",
        )}
      >
        <button
          id={`cv-section-${id}-edit`}
          type="button"
          aria-label={editLabel}
          title={editLabel}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className={cn(
            "bg-cv hover:bg-cv/90 inline-flex size-8 items-center justify-center rounded-md text-white shadow-sm transition-colors",
            canHoverEdit ? "cursor-none" : "cursor-pointer",
          )}
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
      </div>
      {isEmpty ? (
        <div
          id={`cv-section-${id}-empty`}
          className={cn(
            "border-cv/30 bg-cv/4 hover:border-cv/50 hover:bg-cv/8 hover:text-cv flex h-24 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed text-[#333333] transition-colors",
            emptyClassName,
          )}
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
  );

  if (!canHoverEdit) {
    return section;
  }

  return <FollowerPointerCard title={editLabel}>{section}</FollowerPointerCard>;
};

export interface CvLayoutContentProps {
  data: CvData;
  localizedData: LocalizedCvData;
  displayContacts: LocalizedCvData["contacts"];
  aboutMeText: string | null;
  currentLocale: AppLocale;
  canHoverEdit: boolean;
  onEditSection: (section: SectionType) => void;
  t: CvTranslator;
}

/** Modern Layout matching the public CV /curriculum-vitae */
const EditableCvModernLayout: FC<CvLayoutContentProps> = ({
  data,
  localizedData,
  displayContacts,
  aboutMeText,
  currentLocale,
  canHoverEdit,
  onEditSection,
  t,
}) => {
  const availability = localizedData.additionalInformation?.[0]?.text ?? null;
  const remainingAdditionalInfo =
    localizedData.additionalInformation &&
    localizedData.additionalInformation.length > 1
      ? localizedData.additionalInformation.slice(1)
      : [];

  return (
    <div>
      {/* Modern Blue Header with Name, Degree, Photo, Contacts, Availability */}
      <EditableSection
        id="header"
        title={t("headerSection")}
        onClick={() => onEditSection("header")}
        isEmpty={!data.header}
        t={t}
        canHoverEdit={canHoverEdit}
      >
        <HeaderCv
          header={localizedData.header}
          fallbackName={data.profile?.displayName ?? undefined}
          availability={availability}
          contactsSlot={
            <EditableSection
              id="contacts"
              title={t("sections.contact")}
              onClick={() => onEditSection("contacts")}
              isEmpty={displayContacts.length === 0}
              t={t}
              canHoverEdit={canHoverEdit}
              emptyClassName="border-white/40 bg-white/10 text-white hover:border-white/70 hover:bg-white/20"
            >
              <ContactMe contacts={localizedData.contacts} variant="header" />
            </EditableSection>
          }
        />
      </EditableSection>

      {/* Modern 2-Column Responsive Sheet Body */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_17rem]">
        {/* Left main column: About & Experience */}
        <div className="space-y-7 px-6 py-6 md:px-10 md:py-8">
          <EditableSection
            id="about"
            title={t("sections.aboutMe")}
            onClick={() => onEditSection("about")}
            isEmpty={!aboutMeText}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <section className="mb-7">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#0a3d7a] uppercase before:h-4 before:w-1 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
                {t("sections.aboutMe")}
              </h2>
              {aboutMeText ? (
                <p className="text-sm leading-relaxed text-slate-800">
                  {aboutMeText}
                </p>
              ) : null}
            </section>
          </EditableSection>

          <EditableSection
            id="experience"
            title={t("sections.experience")}
            onClick={() => onEditSection("experience")}
            isEmpty={data.experiences.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <Experience
              experiences={localizedData.experiences}
              locale={currentLocale}
            />
          </EditableSection>
        </div>

        {/* Right sidebar: Technical skills, Education, Languages, Soft skills, Additional, References */}
        <aside className="space-y-7 border-t border-slate-200 bg-[#f1f5fb] px-6 py-6 md:border-t-0 md:border-l md:px-7 md:py-8">
          <EditableSection
            id="skills"
            title={t("sections.technicalSkills")}
            onClick={() => onEditSection("skills")}
            isEmpty={data.technicalSkills.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <TechnicalSkills technicalSkills={localizedData.technicalSkills} />
          </EditableSection>

          <EditableSection
            id="education"
            title={t("sections.education")}
            onClick={() => onEditSection("education")}
            isEmpty={data.educations.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <Education educations={localizedData.educations} />
          </EditableSection>

          <EditableSection
            id="languages"
            title={t("sections.languages")}
            onClick={() => onEditSection("languages")}
            isEmpty={data.languages.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <Languages languages={localizedData.languages} />
          </EditableSection>

          <EditableSection
            id="soft-skills"
            title={t("sections.personalSkills")}
            onClick={() => onEditSection("soft-skills")}
            isEmpty={data.softSkills.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <SoftSkills softSkills={localizedData.softSkills} />
          </EditableSection>

          <EditableSection
            id="additional"
            title={t("sections.additionalInformation")}
            onClick={() => onEditSection("additional")}
            isEmpty={remainingAdditionalInfo.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <AdditionalInformation
              additionalInformation={remainingAdditionalInfo}
            />
          </EditableSection>

          <EditableSection
            id="personal-references"
            title={t("sections.personalReferences")}
            onClick={() => onEditSection("personal-references")}
            isEmpty={data.personalReferences.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <PersonalReferences
              personalReferences={localizedData.personalReferences}
            />
          </EditableSection>
        </aside>
      </div>
    </div>
  );
};

/** Classic Layout (the original 9-column grid layout) */
const EditableCvClassicLayout: FC<CvLayoutContentProps> = ({
  data,
  localizedData,
  displayContacts,
  aboutMeText,
  currentLocale,
  canHoverEdit,
  onEditSection,
  t,
}) => {
  return (
    <div>
      <EditableSection
        id="header"
        title={t("headerSection")}
        onClick={() => onEditSection("header")}
        isEmpty={!data.header}
        t={t}
        canHoverEdit={canHoverEdit}
      >
        <HeaderCv
          header={localizedData.header}
          fallbackName={data.profile?.displayName ?? undefined}
        />
      </EditableSection>

      <div className="grid grid-cols-1 bg-white p-5 pb-10 text-black sm:grid-cols-9">
        <div className="flex flex-col gap-6 sm:col-span-3">
          <EditableSection
            id="contacts"
            title={t("sections.contact")}
            onClick={() => onEditSection("contacts")}
            isEmpty={displayContacts.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <ContactMe contacts={localizedData.contacts} />
          </EditableSection>

          <EditableSection
            id="education"
            title={t("sections.education")}
            onClick={() => onEditSection("education")}
            isEmpty={data.educations.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <Education educations={localizedData.educations} />
          </EditableSection>

          <EditableSection
            id="languages"
            title={t("sections.languages")}
            onClick={() => onEditSection("languages")}
            isEmpty={data.languages.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <Languages languages={localizedData.languages} />
          </EditableSection>

          <EditableSection
            id="skills"
            title={t("sections.technicalSkills")}
            onClick={() => onEditSection("skills")}
            isEmpty={data.technicalSkills.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <TechnicalSkills technicalSkills={localizedData.technicalSkills} />
          </EditableSection>
        </div>

        <div className="col-span-1 hidden w-full justify-center sm:flex">
          <div className="border-border h-full w-px border-r" />
        </div>

        <div className="flex flex-col gap-6 sm:col-span-5">
          <EditableSection
            id="about"
            title={t("sections.aboutMe")}
            onClick={() => onEditSection("about")}
            isEmpty={!aboutMeText}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <div className="mb-4">
              <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
                {t("sections.aboutMe")}
              </h5>
              <h3 className="text-xs text-[#1a1a1a]">{aboutMeText}</h3>
            </div>
          </EditableSection>

          <EditableSection
            id="experience"
            title={t("sections.experience")}
            onClick={() => onEditSection("experience")}
            isEmpty={data.experiences.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <Experience
              experiences={localizedData.experiences}
              locale={currentLocale}
            />
          </EditableSection>

          <EditableSection
            id="soft-skills"
            title={t("sections.personalSkills")}
            onClick={() => onEditSection("soft-skills")}
            isEmpty={data.softSkills.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <SoftSkills softSkills={localizedData.softSkills} />
          </EditableSection>

          <EditableSection
            id="additional"
            title={t("sections.additionalInformation")}
            onClick={() => onEditSection("additional")}
            isEmpty={data.additionalInformation.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <AdditionalInformation
              additionalInformation={localizedData.additionalInformation}
            />
          </EditableSection>

          <EditableSection
            id="personal-references"
            title={t("sections.personalReferences")}
            onClick={() => onEditSection("personal-references")}
            isEmpty={data.personalReferences.length === 0}
            t={t}
            canHoverEdit={canHoverEdit}
          >
            <PersonalReferences
              personalReferences={localizedData.personalReferences}
            />
          </EditableSection>
        </div>
      </div>
    </div>
  );
};

/** Scalable layout renderer registry */
const LAYOUT_COMPONENTS: Record<CvLayoutStyle, FC<CvLayoutContentProps>> = {
  modern: EditableCvModernLayout,
  classic: EditableCvClassicLayout,
};

export interface ICvEditableLayoutProps {
  data: CvData;
  aboutMeText: string | null;
  currentLocale: AppLocale;
  defaultLocale?: AppLocale;
  layoutStyle?: CvLayoutStyle;
}

export const EditableCvLayout: FC<ICvEditableLayoutProps> = ({
  data,
  aboutMeText,
  currentLocale,
  layoutStyle = "modern",
}) => {
  const t = useTranslations("admin.cv");
  const { data: languages = [] } = api.appLanguagesAdmin.getAll.useQuery();
  const appLanguages = useMemo(
    () => languages.map(({ id, code }) => ({ id, code })),
    [languages],
  );
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const canHoverEdit = useMediaQuery(FINE_HOVER_QUERY);
  const displayContacts = useMemo(
    () => appendPortfolioWebsiteContact(data.contacts, data.portfolioUrl ?? ""),
    [data.contacts, data.portfolioUrl],
  );

  const localizedData = useMemo(() => {
    return mapCvDataToLocalized(
      {
        ...data,
        contacts: displayContacts,
      },
      appLanguages,
      currentLocale,
    );
  }, [data, displayContacts, appLanguages, currentLocale]);

  const field = useMemo(
    () => createLocalizedFieldResolver(languages, currentLocale),
    [languages, currentLocale],
  );

  const handleClose = (open: boolean) => {
    if (!open) {
      setActiveSection(null);
      setActiveEditId(null);
      setIsAdding(false);
    }
  };

  const handleFormDone = () => {
    setActiveEditId(null);
    setIsAdding(false);
  };

  const getModalTitle = useCallback(
    (section: SectionType) => {
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
        case "personal-references":
          return t("sections.personalReferences");
        default: {
          const _exhaustive: never = section;
          return _exhaustive;
        }
      }
    },
    [t],
  );

  const drawerMeta = useMemo(() => {
    if (!activeSection)
      return { title: "", subtitle: undefined as string | undefined };

    const isEditingOrAdding = Boolean(activeEditId) || isAdding;

    if (activeSection === "header") {
      return {
        title: t("actionTitles.editHeader"),
        subtitle: data.header?.fullName ?? undefined,
      };
    }
    if (activeSection === "about") {
      return {
        title: t("actionTitles.editAbout"),
        subtitle: t("sections.aboutMe"),
      };
    }

    if (!isEditingOrAdding) {
      return {
        title: getModalTitle(activeSection),
        subtitle: undefined,
      };
    }

    const isEdit = Boolean(activeEditId);

    switch (activeSection) {
      case "contacts": {
        const item = activeEditId
          ? data.contacts.find((c) => c.id === activeEditId)
          : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editContact")
            : t("actionTitles.newContact"),
          subtitle: item?.value ?? undefined,
        };
      }
      case "education": {
        const item = activeEditId
          ? data.educations.find((e) => e.id === activeEditId)
          : undefined;
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
      case "experience": {
        const item = activeEditId
          ? data.experiences.find((e) => e.id === activeEditId)
          : undefined;
        const role = item ? field(item.translations, "role") : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editExperience")
            : t("actionTitles.newExperience"),
          subtitle: role ?? item?.company ?? undefined,
        };
      }
      case "languages": {
        const item = activeEditId
          ? data.languages.find((l) => l.id === activeEditId)
          : undefined;
        const name = item ? field(item.translations, "name") : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editLanguage")
            : t("actionTitles.newLanguage"),
          subtitle: name ?? undefined,
        };
      }
      case "skills": {
        const item = activeEditId
          ? data.technicalSkills.find((s) => s.id === activeEditId)
          : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editSkillGroup")
            : t("actionTitles.newSkillGroup"),
          subtitle: item?.category ?? undefined,
        };
      }
      case "soft-skills": {
        const item = activeEditId
          ? data.softSkills.find((s) => s.id === activeEditId)
          : undefined;
        const name = item ? field(item.translations, "name") : undefined;
        return {
          title: isEdit
            ? t("actionTitles.editSoftSkill")
            : t("actionTitles.newSoftSkill"),
          subtitle: name ?? undefined,
        };
      }
      case "additional": {
        const item = activeEditId
          ? data.additionalInformation.find((a) => a.id === activeEditId)
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
      case "personal-references": {
        const item = activeEditId
          ? data.personalReferences.find((r) => r.id === activeEditId)
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
  }, [activeSection, activeEditId, isAdding, data, field, getModalTitle, t]);

  const LayoutComponent =
    LAYOUT_COMPONENTS[layoutStyle] ?? EditableCvModernLayout;

  return (
    <div className="relative">
      <CvContextProvider>
        <LayoutComponent
          data={data}
          localizedData={localizedData}
          displayContacts={localizedData.contacts}
          aboutMeText={aboutMeText}
          currentLocale={currentLocale}
          canHoverEdit={canHoverEdit}
          onEditSection={setActiveSection}
          t={t}
        />
      </CvContextProvider>

      <Sheet open={activeSection !== null} onOpenChange={handleClose}>
        <FormSheetContent
          id="cv-section-sheet"
          title={drawerMeta.title}
          description={drawerMeta.subtitle}
          bodyScroll
        >
          {activeSection === "header" && (
            <HeaderForm
              languages={languages}
              onCancel={() => setActiveSection(null)}
              onSuccess={() => setActiveSection(null)}
            />
          )}

          {activeSection === "about" && (
            <AboutForm
              languages={languages}
              onCancel={() => setActiveSection(null)}
              onSuccess={() => setActiveSection(null)}
            />
          )}

          {activeSection === "contacts" &&
            (activeEditId || isAdding ? (
              <ContactForm
                languages={languages}
                initial={
                  activeEditId
                    ? data.contacts.find((c) => c.id === activeEditId)
                    : undefined
                }
                onCancel={handleFormDone}
                onSuccess={handleFormDone}
              />
            ) : (
              <ContactsList
                languages={languages}
                displayLocale={currentLocale}
                onEditItem={(id) => setActiveEditId(id)}
                onAddNew={() => setIsAdding(true)}
              />
            ))}

          {activeSection === "education" &&
            (activeEditId || isAdding ? (
              <EducationForm
                languages={languages}
                initial={
                  activeEditId
                    ? data.educations.find((e) => e.id === activeEditId)
                    : undefined
                }
                onCancel={handleFormDone}
                onSuccess={handleFormDone}
              />
            ) : (
              <EducationsList
                languages={languages}
                displayLocale={currentLocale}
                onEditItem={(id) => setActiveEditId(id)}
                onAddNew={() => setIsAdding(true)}
              />
            ))}

          {activeSection === "languages" &&
            (activeEditId || isAdding ? (
              <LanguageForm
                languages={languages}
                initial={
                  activeEditId
                    ? data.languages.find((l) => l.id === activeEditId)
                    : undefined
                }
                onCancel={handleFormDone}
                onSuccess={handleFormDone}
              />
            ) : (
              <LanguagesList
                languages={languages}
                displayLocale={currentLocale}
                onEditItem={(id) => setActiveEditId(id)}
                onAddNew={() => setIsAdding(true)}
              />
            ))}

          {activeSection === "skills" &&
            (activeEditId || isAdding ? (
              <SkillForm
                initial={
                  activeEditId
                    ? data.technicalSkills.find((s) => s.id === activeEditId)
                    : undefined
                }
                onCancel={handleFormDone}
                onSuccess={handleFormDone}
              />
            ) : (
              <SkillsList
                onEditItem={(id) => setActiveEditId(id)}
                onAddNew={() => setIsAdding(true)}
              />
            ))}

          {activeSection === "experience" &&
            (activeEditId || isAdding ? (
              <ExperienceForm
                languages={languages}
                initial={
                  activeEditId
                    ? data.experiences.find((e) => e.id === activeEditId)
                    : undefined
                }
                onCancel={handleFormDone}
                onSuccess={handleFormDone}
              />
            ) : (
              <ExperiencesList
                languages={languages}
                displayLocale={currentLocale}
                onEditItem={(id) => setActiveEditId(id)}
                onAddNew={() => setIsAdding(true)}
              />
            ))}

          {activeSection === "soft-skills" &&
            (activeEditId || isAdding ? (
              <SoftSkillForm
                languages={languages}
                initial={
                  activeEditId
                    ? data.softSkills.find((s) => s.id === activeEditId)
                    : undefined
                }
                onCancel={handleFormDone}
                onSuccess={handleFormDone}
              />
            ) : (
              <SoftSkillsList
                languages={languages}
                displayLocale={currentLocale}
                onEditItem={(id) => setActiveEditId(id)}
                onAddNew={() => setIsAdding(true)}
              />
            ))}

          {activeSection === "additional" &&
            (activeEditId || isAdding ? (
              <AdditionalForm
                languages={languages}
                initial={
                  activeEditId
                    ? data.additionalInformation.find(
                        (a) => a.id === activeEditId,
                      )
                    : undefined
                }
                onCancel={handleFormDone}
                onSuccess={handleFormDone}
              />
            ) : (
              <AdditionalList
                languages={languages}
                displayLocale={currentLocale}
                onEditItem={(id) => setActiveEditId(id)}
                onAddNew={() => setIsAdding(true)}
              />
            ))}

          {activeSection === "personal-references" &&
            (activeEditId || isAdding ? (
              <PersonalReferenceForm
                languages={languages}
                initial={
                  activeEditId
                    ? data.personalReferences.find((r) => r.id === activeEditId)
                    : undefined
                }
                onCancel={handleFormDone}
                onSuccess={handleFormDone}
              />
            ) : (
              <PersonalReferencesList
                languages={languages}
                displayLocale={currentLocale}
                onEditItem={(id) => setActiveEditId(id)}
                onAddNew={() => setIsAdding(true)}
              />
            ))}
        </FormSheetContent>
      </Sheet>
    </div>
  );
};

export default EditableCvLayout;
