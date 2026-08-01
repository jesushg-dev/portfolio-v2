import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

const SECTION_LABEL_KEY: Record<
  LocalizedCvData["technicalSkills"][number]["category"],
  string
> = {
  FRONTEND: "header.skills.frontEnd",
  BACKEND: "header.skills.backEnd",
  DATABASE: "header.skills.database",
  TOOLS: "header.skills.tools",
  MOBILE: "header.skills.frontEnd",
  DESKTOP: "header.skills.tools",
  DEVOPS: "header.skills.tools",
  CYBERSECURITY: "header.skills.tools",
  OTHER: "header.skills.tools",
};

interface ITechnicalSkillsProps {
  technicalSkills: LocalizedCvData["technicalSkills"];
}

const TechnicalSkills: FC<ITechnicalSkillsProps> = ({ technicalSkills }) => {
  const t = useTranslations("curriculum");

  if (!technicalSkills.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.technicalSkills")}
      </h5>
      {technicalSkills.map((section) => (
        <div className="mb-4" key={section.id}>
          <p className="mb-2 text-sm font-bold">
            {t(
              SECTION_LABEL_KEY[section.category] as
                | "header.skills.frontEnd"
                | "header.skills.backEnd"
                | "header.skills.database"
                | "header.skills.tools",
            )}
          </p>

          <ul className="grid list-disc grid-cols-2 gap-1 pl-6 text-sm text-[#1a1a1a]">
            {section.items.map((item) => (
              <li key={item}>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
};

export default TechnicalSkills;
