import React from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

const languages = ["english", "spanish", "dutch"] as const;

const Languages: FC = () => {
  const t = useTranslations("curriculum");

  return (
    <>
      <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.languages")}
      </h5>

      <div className="mb-4">
        <ul className="list-none text-xs">
          {languages.map((language) => (
            <li className="mb-2" key={language}>
              <p className="text-sm font-bold">
                {t(`languages.${language}.name`)}
              </p>
              <p className="my-1 text-xs">{t(`languages.${language}.level`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Languages;
