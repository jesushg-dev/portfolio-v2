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
    <div className="text-muted-foreground mb-3 text-xs leading-relaxed">
      <b className="text-foreground block text-xs font-semibold sm:text-sm">
        {language.name}
      </b>
      <span>{language.level}</span>
    </div>
  );
}

const Languages: FC<ILanguagesProps> = ({ languages }) => {
  const t = useTranslations("curriculum");

  if (!languages.length) return null;

  return (
    <section>
      <h2 className="text-primary before:bg-primary mb-3.5 flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase before:h-3.5 before:w-1 before:rounded-xs before:content-['']">
        {t("header.languages")}
      </h2>

      <div className="space-y-1">
        {languages.map((language) => (
          <LanguageItem key={language.id} language={language} />
        ))}
      </div>
    </section>
  );
};

export default Languages;
