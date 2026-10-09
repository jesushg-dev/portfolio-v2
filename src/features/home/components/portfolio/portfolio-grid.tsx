"use client";

import type { FC } from "react";
import { useRef, useMemo, useState, Fragment } from "react";
import { motion, useInView } from "motion/react";
import { useTranslations, useLocale } from "next-intl";

import { api } from "@/trpc/react";
import { LIMIT_PER_PAGE } from "@/utils/constants";

import type { ProjectType } from "@/utils/interfaces/types";

import FilterType from "./filter-type";
import PortfolioItem from "./project-item";
import { PortfolioGridSkeleton } from "./portfolio-grid-skeleton";
import { ProjectEmptyState } from "./project-empty-state";

const type = [undefined, "FRONTEND", "BACKEND", "MOBILE", "DESKTOP"] as const;

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.25 },
  },
};

const limit = LIMIT_PER_PAGE;

interface PortfolioGridProps {
  initialData?: {
    projects: ProjectType[];
    nextCursor: string | null;
  };
}

const PortfolioGrid: FC<PortfolioGridProps> = ({ initialData }) => {
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
        getNextPageParam: (info) => info.nextCursor,
        initialData:
          initialData && crtValue === 0
            ? {
                pages: [initialData],
                pageParams: [undefined],
              }
            : undefined,
      },
    );

  const handleFetchMore = () => {
    void fetchNextPage();
  };

  const allProjects = useMemo(
    () => data?.pages.flatMap((page) => page.projects) ?? [],
    [data],
  );

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
        ) : allProjects.length === 0 ? (
          <ProjectEmptyState
            type={type[crtValue]}
            onReset={() => setCrtValue(0)}
          />
        ) : (
          <motion.ul
            initial="hidden"
            variants={container}
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {data?.pages.map((page, idx) => (
              <Fragment key={page.nextCursor ?? idx}>
                {page.projects.map((project, projectIdx) => (
                  <motion.li
                    layout
                    key={project.id}
                    className="flex justify-center"
                    variants={item}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PortfolioItem
                      {...project}
                      {...labels}
                      priority={idx === 0 && projectIdx < 3}
                    />
                  </motion.li>
                ))}
              </Fragment>
            ))}
          </motion.ul>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-4">
          {data?.pages[data.pages.length - 1]?.nextCursor ? (
            <button
              type="button"
              onClick={handleFetchMore}
              disabled={isFetching ?? isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 pressable inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
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
