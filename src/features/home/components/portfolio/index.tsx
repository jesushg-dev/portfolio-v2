import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { api } from "@/trpc/server";
import { LIMIT_PER_PAGE } from "@/utils/constants";
import type { ProjectType } from "@/utils/interfaces/types";

import PortfolioGrid from "./portfolio-grid";

const Portfolio: FC = async () => {
  const t = await getTranslations("main.portfolio");
  const locale = await getLocale();

  let initialProjects:
    { projects: ProjectType[]; nextCursor: string | null } | undefined;

  try {
    const data = await api.portfolio.getProjects({
      limit: LIMIT_PER_PAGE,
      locale,
    });
    initialProjects = data;
  } catch (error) {
    console.error("Failed to prefetch portfolio projects:", error);
  }

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
        <PortfolioGrid initialData={initialProjects} />
      </section>
    </div>
  );
};

export default Portfolio;
