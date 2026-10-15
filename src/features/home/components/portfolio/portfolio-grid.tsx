"use client";

import type { FC } from "react";
import { useRef, useMemo, useState } from "react";
import { motion, useInView } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";

import { api } from "@/trpc/react";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";
import { Link } from "@/i18n/routing";
import type { ProjectType } from "@/utils/interfaces/types";

import FilterType from "./filter-type";
import PortfolioItem from "./project-item";
import { PortfolioGridSkeleton } from "./portfolio-grid-skeleton";
import { ProjectEmptyState } from "./project-empty-state";
import { PortfolioTopStack } from "./portfolio-top-stack";

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

interface PortfolioGridProps {
  initialData?: {
    projects: ProjectType[];
    nextCursor: string | null;
    totalCount?: number;
    caseStudyCount?: number;
  };
}

const PortfolioGrid: FC<PortfolioGridProps> = ({ initialData }) => {
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);

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
      metaLabels: {
        solo: t("meta.solo"),
        formatTeam: (count: number) => t("meta.team", { count }),
        now: t("meta.now"),
        statuses: {
          IN_PRODUCTION: t("caseStudy.statuses.IN_PRODUCTION"),
          MAINTENANCE: t("caseStudy.statuses.MAINTENANCE"),
          ARCHIVED: t("caseStudy.statuses.ARCHIVED"),
        },
      },
      teaserLabels: {
        formatDecisions: (count: number) => t("teaser.decisions", { count }),
        layers: t("teaser.layers"),
        formatMetrics: (count: number) => t("teaser.metrics", { count }),
      },
    }),
    [t],
  );

  const [crtValue, setCrtValue] = useState<number>(0);

  // If initialData is provided from the RSC, use it without blocking network roundtrip
  const { data, isLoading } = api.portfolio.getProjects.useQuery(
    { limit: LIMIT_PER_PAGE_BIG, locale },
    {
      initialData: initialData
        ? {
            projects: initialData.projects,
            nextCursor: initialData.nextCursor,
            totalCount: initialData.totalCount ?? initialData.projects.length,
            caseStudyCount:
              initialData.caseStudyCount ??
              initialData.projects.filter((p) => p.caseStudyEnabled).length,
          }
        : undefined,
    },
  );

  const allProjects = useMemo(
    () => data?.projects ?? initialData?.projects ?? [],
    [data, initialData],
  );

  const totalCount = data?.totalCount ?? allProjects.length;
  const caseStudyCount =
    data?.caseStudyCount ??
    allProjects.filter((p) => p.caseStudyEnabled).length;

  const counts = useMemo(() => {
    return [
      allProjects.length,
      allProjects.filter((p) => p.type === "FRONTEND").length,
      allProjects.filter((p) => p.type === "BACKEND").length,
      allProjects.filter((p) => p.type === "MOBILE").length,
      allProjects.filter((p) => p.type === "DESKTOP").length,
    ];
  }, [allProjects]);

  const visibleProjects = useMemo(() => {
    const selectedType = type[crtValue];
    const filtered = selectedType
      ? allProjects.filter((p) => p.type === selectedType)
      : allProjects;
    return filtered.slice(0, 6);
  }, [allProjects, crtValue]);

  return (
    <>
      <FilterType value={crtValue} onChange={setCrtValue} counts={counts} />
      <section
        ref={ref}
        role="tabpanel"
        id={`portfolio-tab-panel-${crtValue}`}
        aria-labelledby={`portfolio-tab-tab-${crtValue}`}
      >
        {isLoading && allProjects.length === 0 ? (
          <PortfolioGridSkeleton />
        ) : visibleProjects.length === 0 ? (
          <ProjectEmptyState
            type={type[crtValue]}
            onReset={() => setCrtValue(0)}
          />
        ) : (
          <motion.ul
            initial="hidden"
            variants={container}
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {visibleProjects.map((project, idx) => (
              <motion.li
                layout
                key={project.id}
                className="flex justify-center"
                variants={item}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <PortfolioItem {...project} {...labels} priority={idx < 3} />
              </motion.li>
            ))}
          </motion.ul>
        )}

        <PortfolioTopStack
          projects={allProjects}
          title={t("topStack.title")}
          projectsWord={t("topStack.projectsWord")}
        />

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Link
            href="/projects"
            className="bg-primary text-primary-foreground hover:bg-primary/90 pressable inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-7 text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            <span>{t("allCta.button", { count: totalCount })}</span>
            <span className="bg-card text-foreground flex size-9 items-center justify-center rounded-full shadow-2xs">
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
          <p className="text-muted-foreground text-sm">
            {t("allCta.subtitle", {
              total: totalCount,
              caseStudies: caseStudyCount,
            })}
          </p>
        </div>
      </section>
    </>
  );
};

export default PortfolioGrid;
