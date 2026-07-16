import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";

import PortfolioGrid from "./portfolio-grid";

const Portfolio: FC = async () => {
  const t = await getTranslations("main.portfolio");
  await getLocale();

  return (
    <div className="bg-background-50 relative w-full overflow-hidden">
      <section
        id="portfolio"
        className="mx-auto px-4 py-16 lg:container lg:px-20 lg:py-20"
      >
        <HeaderArticle
          title={t("title")}
          description={t("description")}
          subtitle={t("subtitle")}
        />
        <PortfolioGrid />
      </section>
    </div>
  );
};

export default Portfolio;
