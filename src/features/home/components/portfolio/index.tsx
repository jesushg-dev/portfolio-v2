import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/server";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";

import PortfolioGrid from "./portfolio-grid";

const Portfolio: FC = async () => {
  const t = await getTranslations({
    locale: await getPublicLocale(),
    namespace: "main.portfolio",
  });
  const locale = await getPublicLocale();

  const { projects, totalCount, caseStudyCount } =
    await api.portfolio.getProjects({
      limit: LIMIT_PER_PAGE_BIG,
      locale,
    });

  const compactProjects = projects.map((p) => ({
    ...p,
    skills:
      p.skills?.map((s) => ({
        id: s.id,
        title: s.title,
        image: s.image,
      })) ?? [],
  })) as typeof projects;

  return (
    <div className="bg-muted border-border/40 relative w-full overflow-hidden border-y">
      <section
        id="portfolio"
        className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
      >
        <HeaderArticle
          title={t("title")}
          description={t("description")}
          subtitle={t("subtitle")}
        />
        <PortfolioGrid
          projects={compactProjects}
          totalCount={totalCount}
          caseStudyCount={caseStudyCount}
        />
      </section>
    </div>
  );
};

export default Portfolio;
