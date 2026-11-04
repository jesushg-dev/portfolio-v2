import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { ShowcaseSection, ShowcaseHeading } from "@/components/shared/showcase";
import { api } from "@/trpc/server";

import PortfolioGrid from "./portfolio-grid";

const HOME_PROJECTS_LIMIT = 7;

const Portfolio: FC = async () => {
  const locale = await getPublicLocale();
  const t = await getTranslations({
    locale,
    namespace: "main.portfolio",
  });

  const { projects, totalCount, caseStudyCount } =
    await api.portfolio.getProjects({
      limit: HOME_PROJECTS_LIMIT,
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
    <ShowcaseSection ariaLabelledBy="portfolio-heading">
      <ShowcaseHeading
        sectionId="portfolio"
        eyebrow={t("subtitle")}
        title={t("title")}
        description={t("description")}
      />
      <PortfolioGrid
        projects={compactProjects}
        totalCount={totalCount}
        caseStudyCount={caseStudyCount}
      />
    </ShowcaseSection>
  );
};

export default Portfolio;
