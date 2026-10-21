import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

interface ILanguagesProps {
  languages: LocalizedCvData["languages"];
}

function LanguageItem({
  language,
}: {
  language: LocalizedCvData["languages"][number];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900">{language.name}</h3>
      <p className="text-sm text-slate-600">{language.level}</p>
    </div>
  );
}

const Languages: FC<ILanguagesProps> = ({ languages }) => {
  const t = useTranslations("curriculum");

  if (!languages.length) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#0a3d7a] uppercase before:h-4 before:w-1 before:rounded-full before:bg-[#0a3d7a] before:content-['']">
        {t("header.languages")}
      </h2>

      <div className="space-y-2">
        {languages.map((language) => (
          <LanguageItem key={language.id} language={language} />
        ))}
      </div>
    </section>
  );
};

export default Languages;
