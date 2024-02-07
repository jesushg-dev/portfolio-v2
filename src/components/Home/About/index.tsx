import React, { useMemo } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

import Terminal from "../../Common/Terminal";
import TimeLines from "../../Common/TimeLines";
import HeaderArticle from "@/components/Common/HeaderArticle";

interface IAboutProps {}

const About: FC<IAboutProps> = ({}) => {
  const t = useTranslations("main.about");

  const code = useMemo(() => {
    return `
      const ${t("function.name")} = () => {
        return {
          ${t("function.json.name")}: 'Jesús Enmanuel Hernández González',
          ${t("function.json.languages")}: {
            ${t("function.language.spanish")}: 'Native',
            ${t("function.language.english")}: 'B1'
          },
          ${t("function.json.profession")}: 'Software Developer'
        }
      }
    `;
  }, [t]);

  return (
    <div className="overflow-hidden">
      <section
        id="about"
        className="mx-auto px-4 pb-4 lg:container lg:px-20 lg:pb-20"
      >
        <HeaderArticle title={t("title")} description="" subtitle="" />
        <article className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-16 lg:pb-8">
          <div className="space-y-4">
            <p className="text-primaryText text-center text-base">
              {t("info.description1")}
            </p>
            <p className="text-primaryText text-center text-base">
              {t("info.description2")}
            </p>
            <p className="text-primaryText text-center text-base">
              {t("info.description3")}
            </p>
          </div>

          <Terminal code={code} />
        </article>

        <aside className="flex flex-col items-center gap-2">
          <div className="w-full border-b border-background-200 py-6 font-bold text-primary-600 lg:hidden">
            <h2 className="text-center">{t("timeline.title")}</h2>
          </div>
          <div className="w-full overflow-x-auto lg:pt-4">
            <div className="flex flex-col items-center gap-2">
              <TimeLines />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default About;
