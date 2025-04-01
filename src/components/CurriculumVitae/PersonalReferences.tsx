import React from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

const personalReferences = ["reference1", "reference2", "reference3"] as const;

const PersonalReferences: FC = () => {
  const t = useTranslations("curriculum");

  return (
    <>
      <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.personalReferences")}
      </h5>

      <div className="mb-2">
        {personalReferences.map((item) => (
          <div className="flex text-xs" key={item}>
            <p className="mr-1">-</p>
            <p className="m-0">
              {t(`personalReferences.${item}.name`)} -{" "}
              {t(`personalReferences.${item}.role`)} - {t("telephone")}
              {t(`personalReferences.${item}.phoneNumber`)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default PersonalReferences;
