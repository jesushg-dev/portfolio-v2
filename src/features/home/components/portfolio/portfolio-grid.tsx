"use client";

import { useCallback, type FC } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { LinkPreview } from "@/components/ui/link-preview";
import { useRouter } from "@/i18n/routing";
import type { ProjectType } from "@/utils/interfaces/types";
import { ProjectCatalogItem } from "@/features/projects/components/project-catalog-item";
import { PortfolioTopStack } from "./portfolio-top-stack";

interface PortfolioGridProps {
  projects: ProjectType[];
  totalCount: number;
  caseStudyCount: number;
}

const KIND_KEYS = ["PROFESSIONAL", "PERSONAL", "LEARNING"] as const;
type PortfolioKindKey = (typeof KIND_KEYS)[number];
const isPortfolioKindKey = (k: unknown): k is PortfolioKindKey =>
  typeof k === "string" && KIND_KEYS.includes(k as PortfolioKindKey);

const PortfolioGrid: FC<PortfolioGridProps> = ({
  projects,
  totalCount,
  caseStudyCount,
}) => {
  const router = useRouter();
  const t = useTranslations("main.portfolio");

  const handlePreview = useCallback(
    (project: ProjectType) => {
      if (project.caseStudyEnabled && project.slug) {
        router.push({
          pathname: "/projects/[slug]",
          params: { slug: project.slug },
        });
      } else {
        router.push("/projects");
      }
    },
    [router],
  );

  return (
    <section aria-label={t("title")}>
      {/* 7 Showcase Projects (1 Featured Hero + 6 Grid Cards: 2 complete rows of 3) */}
      <div className="mt-12 grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, idx) => (
          <div
            key={project.id}
            className={
              idx === 0
                ? "col-span-1 md:col-span-2 lg:col-span-3"
                : "col-span-1"
            }
          >
            <ProjectCatalogItem
              project={project}
              isFeaturedHero={idx === 0}
              onPreview={handlePreview}
              showSkills={false}
              showCaseStudyLink={false}
              metaText={getProjectMetaText(
                project,
                t as unknown as (key: string) => string,
              )}
              readCaseStudyLabel={t("actions.caseStudy")}
              kindLabel={
                project.kind && isPortfolioKindKey(project.kind)
                  ? t(`kind.${project.kind}`)
                  : project.kind || ""
              }
            />
          </div>
        ))}
      </div>

      {/* Top Tech Stack Pills */}
      <PortfolioTopStack
        projects={projects}
        title={t("topStack.title")}
        projectsWord={t("topStack.projectsWord")}
      />

      {/* CTA Button to Full Catalog */}
      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <LinkPreview
          url="/projects"
          className="btn-primary-glow pressable inline-flex min-h-11 items-center gap-3 rounded-full px-6 py-2.5 text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
        >
          <span>{t("allCta.button", { count: totalCount })}</span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </LinkPreview>
        <p className="text-muted-foreground text-sm">
          {t("allCta.subtitle", {
            total: totalCount,
            caseStudies: caseStudyCount,
          })}
        </p>
      </div>
    </section>
  );
};

export function getProjectMetaText(
  project: ProjectType,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const parts: string[] = [];

  const kindStr = project.kind ? t(`kind.${project.kind}`) || project.kind : "";
  if (kindStr) parts.push(kindStr);

  if (typeof project.teamSize === "number" && project.teamSize > 0) {
    parts.push(
      project.teamSize === 1
        ? t("meta.solo")
        : t("meta.team", { count: project.teamSize }),
    );
  }

  if (project.startedAt) {
    const startYear = project.startedAt.slice(0, 4);
    if (project.endedAt) {
      const endYear = project.endedAt.slice(0, 4);
      parts.push(startYear === endYear ? startYear : `${startYear}–${endYear}`);
    } else {
      parts.push(`${startYear}–${t("meta.now")}`);
    }
  }

  if (project.status) {
    try {
      const statusText = t(`caseStudy.statuses.${project.status}`);
      if (statusText) parts.push(statusText);
    } catch {
      // fallback
    }
  }

  return parts.join(" · ");
}

export default PortfolioGrid;
