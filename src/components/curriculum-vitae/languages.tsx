import type { FC } from "react";
import { useTranslations } from "next-intl";

import { getLocalizedText } from "@/lib/i18n/localized";
import type { CvData, CvLocaleProps } from "./types";

interface ILanguagesProps extends CvLocaleProps {
  languages: CvData["languages"];
}

const Languages: FC<ILanguagesProps> = ({
  languages,
  locale,
  defaultLocale,
}) => {
  const t = useTranslations("curriculum");

  if (!languages.length) return null;

  return (
    <>
      <h5 className="text-blue text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.languages")}
      </h5>

      <div className="mb-4">
        <ul className="list-none text-xs">
          {languages.map((language) => (
            <li className="mb-2" key={language.id}>
              <p className="text-sm font-bold">
                {getLocalizedText(language.name, locale, defaultLocale)}
              </p>
              <p className="my-1 text-xs">
                {getLocalizedText(language.level, locale, defaultLocale)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Languages;
