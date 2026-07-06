import type { FC } from "react";
import { useTranslations } from "next-intl";

import { getLocalizedText } from "@/lib/i18n/localized";
import type { CvData, CvLocaleProps } from "./types";

interface ISoftSkillsProps extends CvLocaleProps {
  softSkills: CvData["softSkills"];
}

const SoftSkills: FC<ISoftSkillsProps> = ({
  softSkills,
  locale,
  defaultLocale,
}) => {
  const t = useTranslations("curriculum");

  if (!softSkills.length) return null;

  return (
    <>
      <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.personalSkills")}
      </h5>

      <div className="mb-4">
        <ul className="list-disc pl-8 text-xs">
          {softSkills.map((skill) => (
            <li key={skill.id}>
              {getLocalizedText(skill.name, locale, defaultLocale)}.
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default SoftSkills;
