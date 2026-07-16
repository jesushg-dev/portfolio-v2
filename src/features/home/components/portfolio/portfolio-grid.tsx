"use client";

import type { FC } from "react";
import { useRef, useMemo, useState, Fragment } from "react";
import { motion, useInView } from "motion/react";
import { useTranslations, useLocale } from "next-intl";

import { api } from "@/trpc/react";
import { LIMIT_PER_PAGE } from "@/utils/constants";

import FilterType from "./filter-type";
import PortfolioItem from "./project-item";
import { PortfolioGridSkeleton } from "./portfolio-grid-skeleton";

const type = [undefined, "FRONTEND", "BACKEND", "MOBILE", "DESKTOP"] as const;

const container = {
  hidden: { opacity: 1, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const limit = LIMIT_PER_PAGE;

const PortfolioGrid: FC = () => {
  const locale = useLocale();
  const ref = useRef(null);

  const t = useTranslations("main.portfolio");

  const isInView = useInView(ref, { once: true });
  const labels = useMemo(
    () => ({
      urlName: t("actions.view"),
      sourceName: t("actions.source"),
      caseStudyLabel: t("actions.caseStudy"),
      privateName: t("private.title"),
      privateDescription: t("private.description"),
      canSeeDemo: t("private.canSeeDemo"),
      kindLabels: {
        PROFESSIONAL: t("kind.PROFESSIONAL"),
        PERSONAL: t("kind.PERSONAL"),
        LEARNING: t("kind.LEARNING"),
      },
    }),
    [t],
  );

  const [crtValue, setCrtValue] = useState<number>(0);
  const { data, isFetching, isLoading, fetchNextPage } =
    api.portfolio.getProjects.useInfiniteQuery(
      { limit, locale, type: type[crtValue] },
      {
        getNextPageParam: (info) => info.cursor,
      },
    );

  const handleFetchMore = () => {
    void fetchNextPage();
  };

  return (
    <>
      <FilterType value={crtValue} onChange={setCrtValue} />
      <section
        ref={ref}
        role="tabpanel"
        id={`portfolio-tab-panel-${crtValue}`}
        aria-labelledby={`portfolio-tab-tab-${crtValue}`}
      >
        {isLoading ? (
          <PortfolioGridSkeleton />
        ) : (
          <motion.ul
            initial="hidden"
            variants={container}
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
          >
            {data?.pages.map((page, idx) => (
              <Fragment key={page.cursor ?? idx}>
                {page.data.map((project) => (
                  <motion.li
                    layout
                    key={project.id}
                    className="flex justify-center"
                    variants={item}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PortfolioItem {...project} {...labels} />
                  </motion.li>
                ))}
              </Fragment>
            ))}
          </motion.ul>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          {data?.pages[data.pages.length - 1].hasMore ? (
            <button
              type="button"
              onClick={handleFetchMore}
              disabled={isFetching ?? isLoading}
              className="bg-primary pressable text-primary-foreground hover:bg-primary/90 rounded-sm px-4 py-2 font-bold"
            >
              {isFetching ? t("pagination.loading") : t("pagination.loadMore")}
            </button>
          ) : null}
        </div>
      </section>
    </>
  );
};

export default PortfolioGrid;
