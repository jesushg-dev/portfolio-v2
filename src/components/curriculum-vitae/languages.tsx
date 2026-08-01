import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

interface ILanguagesProps {
  languages: LocalizedCvData["languages"];
}

function LanguageItem({ language }: { language: LocalizedCvData["languages"][number] }) {
  return (
    <li className="mb-2">
      <p className="text-sm font-bold">{language.name}</p>
      <p className="my-1 text-sm text-[#333333]">{language.level}</p>
    </li>
  );
}

const Languages: FC<ILanguagesProps> = ({ languages }) => {
  const t = useTranslations("curriculum");

  if (!languages.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.languages")}
      </h5>

      <div className="mb-4">
        <ul className="list-none text-sm">
          {languages.map((language) => (
            <LanguageItem key={language.id} language={language} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default Languages;
