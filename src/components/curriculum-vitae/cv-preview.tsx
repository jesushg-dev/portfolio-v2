import type { FC } from "react";
import { useTranslations } from "next-intl";

import HeaderCv from "@/components/curriculum-vitae/header-cv";
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
  const availability = data.additionalInformation?.[0]?.text ?? null;
  const remainingAdditionalInfo =
    data.additionalInformation && data.additionalInformation.length > 1
      ? data.additionalInformation.slice(1)
      : [];

  return (
    <CvContextProvider>
      <HeaderCv
        header={data.header}
        fallbackName={data.profile?.displayName ?? null}
        contacts={data.contacts}
        availability={availability}
      />
      <div
        className={
          pdfMode
            ? "grid grid-cols-1 px-5 pt-2 md:grid-cols-[1fr_17rem]"
            : "grid grid-cols-1 md:grid-cols-[1fr_17rem]"
        }
      >
        <div className="px-6 py-6 md:px-10 md:py-8">
          {aboutMeText ? (
            <section className="mb-7">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#0a3d7a] uppercase before:h-4 before:w-1 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
                {t("header.aboutMe")}
              </h2>
              <p className="text-sm leading-relaxed text-slate-800">
                {aboutMeText}
              </p>
            </section>
          ) : null}

          <Experience experiences={data.experiences} locale={locale} />
        </div>

        <aside className="space-y-7 border-t border-slate-200 bg-[#f1f5fb] px-6 py-6 md:border-t-0 md:border-l md:px-7 md:py-8">
          <TechnicalSkills technicalSkills={data.technicalSkills} />
          <Education educations={data.educations} />
          <Languages languages={data.languages} />
          <SoftSkills softSkills={data.softSkills} />
          {remainingAdditionalInfo.length > 0 ? (
            <AdditionalInformation
              additionalInformation={remainingAdditionalInfo}
            />
          ) : null}
        </aside>
      </div>
    </CvContextProvider>
  );
};

export default CvPreview;
