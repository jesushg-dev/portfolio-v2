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
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#0a3d7a] uppercase before:h-4 before:w-1 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
        {t("header.technicalSkills")}
      </h2>

      <div className="space-y-3">
        {technicalSkills.map((section) => (
          <div key={section.id}>
            <h3 className="mb-1.5 text-sm font-bold text-slate-900">
              {t(
                (SECTION_LABEL_KEY[section.category] ??
                  "header.skills.tools") as
                  | "header.skills.frontEnd"
                  | "header.skills.backEnd"
                  | "header.skills.database"
                  | "header.skills.tools",
              )}
            </h3>

            <ul className="flex flex-wrap gap-1.5">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-[#0a3d7a]/20 bg-white px-2 py-0.5 text-sm leading-[1.35] text-slate-800"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TechnicalSkills;
