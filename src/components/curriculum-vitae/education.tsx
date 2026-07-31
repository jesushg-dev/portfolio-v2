import type { FC } from "react";
import { useTranslations } from "next-intl";

import { getLocalizedText } from "@/lib/i18n/localized";
import type { CvData, CvLocaleProps } from "./types";

interface IEducationProps extends CvLocaleProps {
  educations: CvData["educations"];
}

const Education: FC<IEducationProps> = ({
  educations,
  locale,
  defaultLocale,
}) => {
  const t = useTranslations("curriculum");

  if (!educations.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.education")}
      </h5>

      <div className="mb-4">
        {educations.map((education) => {
          const degreeName = getLocalizedText(
            education.degreeName,
            locale,
            defaultLocale,
          );
          const location = getLocalizedText(
            education.location,
            locale,
            defaultLocale,
          );
          const dates =
            education.dates ??
            (education.startYear || education.endYear
              ? `${education.startYear ?? ""} - ${education.endYear ?? ""}`
              : "");

          return (
            <section className="mb-4" key={education.id}>
              <header>
                <h5 className="text-sm font-bold">{degreeName}</h5>
                <h6 className="text-sm text-[#333333]">
                  {education.institution}
                  {location ? ` | ${location}` : ""}
                </h6>
              </header>
              {dates ? (
                <p className="my-1 text-sm text-[#333333]">{dates}</p>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
};

export default Education;
