"use client";
import { useMemo, type FC } from "react";
import { useTranslations } from "next-intl";
import Terminal from "@/components/shared/terminal";

const AboutTerminal: FC = () => {
  const t = useTranslations("main.about");

  const code = useMemo(() => {
    return `
      const ${t("function.name")} = () => {
        return {
          ${t("function.json.name")}: 'Jesús Enmanuel Hernández González',
          ${t("function.json.languages")}: {
            ${t("function.language.spanish")}: 'Native',
            ${t("function.language.english")}: 'B2+',
            ${t("function.language.dutch")}: 'A1'
          },
          ${t("function.json.profession")}: 'Software Developer'
        }
      }
    `;
  }, [t]);

  return <Terminal code={code} />;
};

export default AboutTerminal;
