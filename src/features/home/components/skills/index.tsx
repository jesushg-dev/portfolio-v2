import dynamic from "next/dynamic";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import HeaderArticle from "@/components/shared/header-article";

import { LoadingFixed } from "@/components/shared/loading";
import SkillsFilterAndGroup from "./skills-filter-and-group";

const BgParticles = dynamic(() => import("./bg-particles"), {
  loading: () => <LoadingFixed />,
});

async function Skills() {
  const locale = await getLocale();
  const t = await getTranslations("main.skills");

  return (
    <div className="relative">
      <article className="mx-auto px-4 pb-4 lg:container lg:px-20 lg:pb-20">
        <BgParticles />
        <HeaderArticle
          showIcon
          title={t("title")}
          subtitle={t("subtitle")}
          description={t("description")}
        />
        <div id="skills" className="z-10 overflow-hidden">
          <SkillsFilterAndGroup locale={locale} />
          <div className="container mx-auto flex w-full justify-center py-5">
            <Link
              scroll
              href="/certificates"
              className="group text-primary-600 z-30 mt-4 inline-flex items-center gap-1 text-sm font-medium"
            >
              {t("modal.seeCertificates")}
              <span
                aria-hidden="true"
                className="block transition group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

export default Skills;
