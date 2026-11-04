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
            ? "grid grid-cols-1 px-5 pt-2 md:grid-cols-[1.9fr_1fr]"
            : "grid grid-cols-1 md:grid-cols-[1.9fr_1fr]"
        }
      >
        <div className="px-6 py-8 md:px-10 md:py-9">
          {aboutMeText ? (
            <section className="mb-8">
              <h2 className="text-primary before:bg-primary mb-3.5 flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase before:h-3.5 before:w-1 before:rounded-xs before:content-['']">
                {t("header.aboutMe")}
              </h2>
              <p className="text-foreground/90 text-sm leading-relaxed">
                {aboutMeText}
              </p>
            </section>
          ) : null}

          <Experience experiences={data.experiences} locale={locale} />
        </div>

        <aside className="border-border/60 bg-muted/30 space-y-7 border-t px-6 py-8 md:border-t-0 md:border-l md:px-7 md:py-9">
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
