import type { FC } from "react";
import { useTranslations } from "next-intl";

import { getLocalizedText } from "@/lib/i18n/localized";
import type { CvData, CvLocaleProps } from "./types";

interface IExperiencesProps extends CvLocaleProps {
  experiences: CvData["experiences"];
}

const Experiences: FC<IExperiencesProps> = ({
  experiences,
  locale,
  defaultLocale,
}) => {
  const t = useTranslations("curriculum");

  if (!experiences.length) return null;

  return (
    <>
      <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.experience")}
      </h5>

      {experiences.map((experience) => {
        const role = getLocalizedText(experience.role, locale, defaultLocale);
        return (
          <div className="mb-4" key={experience.id}>
            <h3 className="text-sm font-bold">{role}</h3>
            <h4 className="my-1 text-xs">
              {experience.company}
              {experience.dates ? ` · ${experience.dates}` : ""}
            </h4>
            {experience.responsibilities.length > 0 ? (
              <ul className="list-disc pl-8 text-xs">
                {experience.responsibilities.map((responsibility) => (
                  <li key={responsibility.id}>
                    {getLocalizedText(
                      responsibility.text,
                      locale,
                      defaultLocale,
                    )}
                    .
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

export default Experiences;
