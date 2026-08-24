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
import type { Locale } from "@/i18n/config";
import type { LocalizedCvData } from "./types";

interface ICvPreviewProps {
  data: LocalizedCvData;
  aboutMeText: string | null;
  pdfMode?: boolean;
  locale?: Locale;
}

const CvPreview: FC<ICvPreviewProps> = ({
  data,
  aboutMeText,
  pdfMode = false,
  locale,
}) => {
  const t = useTranslations("curriculum");

  return (
    <CvContextProvider>
      <HeaderCv
        header={data.header}
        fallbackName={data.profile?.displayName ?? null}
      />
      <div
        className={
          pdfMode
            ? "grid grid-cols-1 px-5 pt-2 sm:grid-cols-9"
            : "grid grid-cols-1 p-5 pb-10 sm:grid-cols-9"
        }
      >
        <div className="sm:col-span-3">
          <ContactMe contacts={data.contacts} />
          <Education educations={data.educations} />
          <Languages languages={data.languages} />
          <TechnicalSkills technicalSkills={data.technicalSkills} />
        </div>
        <div className="col-span-1 hidden w-full justify-center sm:flex">
          <div className="h-full w-[1px] border-r" />
        </div>
        <div className="sm:col-span-5">
          {aboutMeText ? (
            <div className="mb-4">
              <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
                {t("header.aboutMe")}
              </h5>
              <h3 className="text-sm text-[#1a1a1a]">{aboutMeText}</h3>
            </div>
          ) : null}

          <Experience experiences={data.experiences} locale={locale} />
          <SoftSkills softSkills={data.softSkills} />
          <AdditionalInformation
            additionalInformation={data.additionalInformation}
          />
        </div>
      </div>
    </CvContextProvider>
  );
};

export default CvPreview;
