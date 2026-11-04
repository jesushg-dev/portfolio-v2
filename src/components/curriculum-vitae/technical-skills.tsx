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
      <h2 className="text-primary before:bg-primary mb-3.5 flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase before:h-3.5 before:w-1 before:rounded-xs before:content-['']">
        {t("header.technicalSkills")}
      </h2>

      <div className="space-y-3">
        {technicalSkills.map((section) => (
          <div key={section.id}>
            <h3 className="text-muted-foreground mb-1.5 text-xs font-semibold">
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
                  className="border-border bg-card text-foreground rounded-lg border px-2.5 py-1 text-xs font-medium shadow-2xs"
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
