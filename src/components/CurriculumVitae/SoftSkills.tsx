import React, { useCallback } from "react";
import type { FC, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { ClientLocalInsightsIcon } from "./ClientIcon";

interface IExperienceProps {}

const Experience: FC<IExperienceProps> = ({}) => {
  const t = useTranslations("curriculum");

  const renderItems = useCallback(
    (chunks: ReactNode) => <li className="">{chunks}.</li>,
    [t],
  );

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg font-semibold uppercase tracking-tight text-cv">
        <ClientLocalInsightsIcon />
        {t("header.personalSkills")}
      </h5>

      <div className="mb-4">
        <ul className="list-disc pl-8 text-xs">
          {t.rich("softSkills", {
            item: renderItems,
          })}
        </ul>
      </div>
    </>
  );
};

export default Experience;
