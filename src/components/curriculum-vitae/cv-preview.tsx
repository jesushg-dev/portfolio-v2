import type { FC } from "react";
import { useTranslations } from "next-intl";

import HeaderCv from "@/components/curriculum-vitae/header-cv";
import ContactMe from "@/components/curriculum-vitae/contact-me";
import Education from "@/components/curriculum-vitae/education";
import Languages from "@/components/curriculum-vitae/languages";
import TechnicalSkills from "@/components/curriculum-vitae/technical-skills";
import Experience from "@/components/curriculum-vitae/experiences";
import SoftSkills from "@/components/curriculum-vitae/soft-skills";
import AdditionalInformation from "@/components/curriculum-vitae/additional-information";
import { CvContextProvider } from "@/hoc/cv-context-provider";
import type { Locale as AppLocale } from "@/i18n/config";

import type {
  CvHeader,
  Profile,
  CvContact,
  CvEducation,
  CvLanguage,
  CvTechnicalSkill,
  CvExperience,
  CvSoftSkill,
  CvAdditionalInfo,
  CvResponsibility,
} from "@prisma/client";

interface ICvPreviewProps {
  data: {
    header: CvHeader | null;
    profile: Profile | null;
    contacts: CvContact[];
    educations: CvEducation[];
    languages: CvLanguage[];
    technicalSkills: CvTechnicalSkill[];
    experiences: (CvExperience & { responsibilities: CvResponsibility[] })[];
    softSkills: CvSoftSkill[];
    additionalInformation: CvAdditionalInfo[];
  };
  aboutMeText: string | null;
  currentLocale: AppLocale;
  defaultLocale: AppLocale;
}

const CvPreview: FC<ICvPreviewProps> = ({
  data,
  aboutMeText,
  currentLocale,
  defaultLocale,
}) => {
  const t = useTranslations("curriculum");

  return (
    <CvContextProvider>
      <HeaderCv
        header={data.header}
        fallbackName={data.profile?.displayName ?? null}
        locale={currentLocale}
        defaultLocale={defaultLocale}
      />
      <div className="grid grid-cols-1 p-5 pb-10 sm:grid-cols-9">
        <div className="sm:col-span-3">
          <ContactMe
            contacts={data.contacts}
            locale={currentLocale}
            defaultLocale={defaultLocale}
          />
          <Education
            educations={data.educations}
            locale={currentLocale}
            defaultLocale={defaultLocale}
          />
          <Languages
            languages={data.languages}
            locale={currentLocale}
            defaultLocale={defaultLocale}
          />
          <TechnicalSkills technicalSkills={data.technicalSkills} />
        </div>
        <div className="col-span-1 hidden w-full justify-center sm:flex">
          <div className="h-full w-[1px] border-r" />
        </div>
        <div className="sm:col-span-5">
          {aboutMeText ? (
            <div className="mb-4">
              <h5 className="text-cv text-blue mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
                {t("header.aboutMe")}
              </h5>
              <h3 className="text-xs">{aboutMeText}</h3>
            </div>
          ) : null}

          <Experience
            experiences={data.experiences}
            locale={currentLocale}
            defaultLocale={defaultLocale}
          />
          <SoftSkills
            softSkills={data.softSkills}
            locale={currentLocale}
            defaultLocale={defaultLocale}
          />
          <AdditionalInformation
            additionalInformation={data.additionalInformation}
            locale={currentLocale}
            defaultLocale={defaultLocale}
          />
        </div>
      </div>
    </CvContextProvider>
  );
};

export default CvPreview;
