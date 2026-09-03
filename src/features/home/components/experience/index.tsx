import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";
import ExperienceAccordionLazy from "./experience-accordion-lazy";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const Experience: FC = async () => {
  const t = await getTranslations("main.experience");
  const locale = await getLocale();

  const experiences = isLocale(locale)
    ? await api.portfolio.getExperiencesPublic({ locale, limit: 4 })
    : [];

  if (experiences.length === 0) return null;

  return (
    <div className="bg-background relative w-full overflow-hidden">
      <section className="mx-auto px-4 py-16 lg:container lg:px-20 lg:py-20">
        <HeaderArticle
          title={t("title")}
          description={t("subtitle")}
          subtitle=""
        />

        <ExperienceAccordionLazy
          experiences={experiences}
          viewAllLabel={t("viewAll")}
        />
      </section>
    </div>
  );
};

export default Experience;
