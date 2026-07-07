import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import TimeLines from "@/components/shared/time-lines";
import HeaderArticle from "@/components/shared/header-article";
import AboutTerminal from "./about-terminal";

import { resolveTenant } from "@/lib/tenant/resolve";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const About: FC = async () => {
  const t = await getTranslations("main.about");
  const locale = await getLocale();

  const tenant = await resolveTenant();
  const terminalData =
    tenant && isLocale(locale)
      ? await api.cv.getTerminalPublic({ locale })
      : null;

  return (
    <div className="overflow-hidden">
      <section
        id="about"
        className="mx-auto px-4 pb-4 lg:container lg:px-20 lg:pb-20"
      >
        <HeaderArticle title={t("title")} description="" subtitle="" />
        <article className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-16 lg:pb-8">
          <div className="space-y-4">
            <p className="text-primaryText-500 text-center text-base">
              {t("info.description1")}
            </p>
            <p className="text-primaryText-500 text-center text-base">
              {t("info.description2")}
            </p>
            <p className="text-primaryText-500 text-center text-base">
              {t("info.description3")}
            </p>
          </div>
          {terminalData ? <AboutTerminal data={terminalData} /> : null}
        </article>

        <aside className="flex flex-col items-center gap-2">
          <div className="border-background-200 text-primary-600 w-full border-b py-6 font-bold lg:hidden">
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
