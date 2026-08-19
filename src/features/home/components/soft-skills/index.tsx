import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";
import SoftSkillsBentoLazy from "./soft-skills-bento-lazy";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const SoftSkills: FC = async () => {
  const t = await getTranslations("main.soft-skills");
  const locale = await getLocale();

  const data = isLocale(locale)
    ? await api.portfolio.getSoftSkillsPublic({ locale })
    : null;

  const items = data?.items ?? [];

  if (items.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden">
      <section className="mx-auto px-4 py-16 lg:container lg:px-20 lg:py-20">
        <HeaderArticle
          title={t("title")}
          subtitle={t("subtitle")}
          description={t("description")}
        />
        <SoftSkillsBentoLazy items={items} />
      </section>
    </div>
  );
};

export default SoftSkills;
