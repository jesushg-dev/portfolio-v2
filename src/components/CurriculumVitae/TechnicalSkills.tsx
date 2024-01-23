import React, { useCallback } from "react";
import type { FC, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { ClientLocalSettingsIcon } from "./ClientIcon";

interface ITechnicalSkillsProps {}

const skillsSection = ["frontEnd", "backEnd", "database", "tools"] as const;

const TechnicalSkills: FC<ITechnicalSkillsProps> = ({}) => {
  const t = useTranslations("curriculum");

  const renderItems = useCallback(
    (chunks: ReactNode) => (
      <li>
        <p>{chunks}</p>
      </li>
    ),
    [t],
  );

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg font-semibold uppercase tracking-tight text-cv">
        <ClientLocalSettingsIcon />
        {t("header.technicalSkills")}
      </h5>
      {skillsSection.map((section) => (
        <div className="mb-4" key={section}>
          <p className="mb-2 text-sm font-bold">
            {t(`header.skills.${section}`)}
          </p>

          <ul className="grid list-disc grid-cols-2 gap-1 pl-6 text-xs ">
            {t.rich(`skills.${section}`, {
              item: renderItems,
            })}
          </ul>
        </div>
      ))}
      <div className="mb-4">
        {skillsSection.map((section) => (
          <div key={section} />
        ))}
      </div>
    </>
  );
};

export default TechnicalSkills;
