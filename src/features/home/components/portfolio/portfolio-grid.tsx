"use client";

import type { FC } from "react";
import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { LinkPreview } from "@/components/ui/link-preview";
import type { ProjectType } from "@/utils/interfaces/types";

import FilterType from "./filter-type";
import PortfolioItem from "./project-item";
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
  projects: ProjectType[];
  totalCount: number;
  caseStudyCount: number;
}

const PortfolioGrid: FC<PortfolioGridProps> = ({
  projects: allProjects,
  totalCount,
  caseStudyCount,
}) => {
  const panelRef = useRef<HTMLElement>(null);
  const isInView = useInView(panelRef, { once: true });

  const t = useTranslations("main.portfolio");

  const labels = useMemo(
    () => (project: ProjectType) => ({
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
        team: t("meta.team", { count: project.teamSize ?? 0 }),
        now: t("meta.now"),
        statuses: {
          IN_PRODUCTION: t("caseStudy.statuses.IN_PRODUCTION"),
          MAINTENANCE: t("caseStudy.statuses.MAINTENANCE"),
          ARCHIVED: t("caseStudy.statuses.ARCHIVED"),
        },
      },
      teaserLabels: {
        decisions: t("teaser.decisions", {
          count: project.csInfo?.decisions ?? 0,
        }),
        layers: t("teaser.layers"),
        metrics: t("teaser.metrics", { count: project.csInfo?.metrics ?? 0 }),
      },
    }),
    [t],
  );

  const [crtValue, setCrtValue] = useState<number>(0);

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
        ref={panelRef}
        role="tabpanel"
        id={`portfolio-tab-panel-${crtValue}`}
        aria-labelledby={`portfolio-tab-tab-${crtValue}`}
      >
        {visibleProjects.length === 0 ? (
          <ProjectEmptyState
            type={type[crtValue]}
            onReset={() => setCrtValue(0)}
          />
        ) : (
          <motion.ul
            initial={false}
            variants={container}
            animate="visible"
            className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {visibleProjects.map((project) => (
              <motion.li
                layout={isInView}
                key={project.id}
                className="flex justify-center"
                variants={item}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <PortfolioItem {...project} {...labels(project)} />
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
          <LinkPreview
            url="/projects"
            className="bg-primary text-primary-foreground hover:bg-primary/90 pressable inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-7 text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            <span>{t("allCta.button", { count: totalCount })}</span>
            <span className="bg-card text-foreground flex size-9 items-center justify-center rounded-full shadow-2xs">
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </LinkPreview>
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
