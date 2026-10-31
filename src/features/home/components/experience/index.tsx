import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";
import { ExperienceAccordion } from "./experience-accordion";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const Experience: FC = async () => {
  const t = await getTranslations({
    locale: await getPublicLocale(),
    namespace: "main.experience",
  });
  const locale = await getPublicLocale();

  const experiences = isLocale(locale)
    ? await api.portfolio.getExperiencesPublic({ locale, limit: 4 })
    : [];

  if (experiences.length === 0) return null;

  return (
    <div className="bg-card relative w-full overflow-hidden">
      <section className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20">
        <HeaderArticle
          title={t("title")}
          subtitle={t("subtitle")}
          className="mb-12 sm:mb-14"
        />
        <ExperienceAccordion
          experiences={experiences}
          viewAllLabel={t("viewAll")}
        />
      </section>
    </div>
  );
};

export default Experience;
