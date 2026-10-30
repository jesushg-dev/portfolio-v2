"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, LayoutGrid, Lock } from "lucide-react";
import { GithubIcon } from "@/components/shared/brand-icons";
import Tab from "@/components/custom-ui/custom-tab";
import TabItem from "@/components/custom-ui/custom-tab/tab-item";
import { MediaImage } from "@/components/shared/media-image";
import { resolveIcon } from "@/lib/icons/icon-registry";
import { cn } from "@/lib/utils";

import { SkillChip } from "./case-study-primitives";
import type { ProjectCaseStudyViewProps } from "./case-study-view.types";

function formatDate(value: Date | string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function ProjectSnapshot({
  project,
}: {
  project: ProjectCaseStudyViewProps["project"];
}) {
  const locale = useLocale();
  const t = useTranslations("main.portfolio.caseStudy");
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);

  const gallery =
    project.caseStudy.gallery && project.caseStudy.gallery.length > 0
      ? project.caseStudy.gallery
      : undefined;
  const currentImage = gallery?.[activeScreenIndex]
    ? gallery[activeScreenIndex].image
    : project.image;
  const currentTitle = gallery?.[activeScreenIndex]
    ? gallery[activeScreenIndex].title
    : project.title;

  const projectTypes: Record<string, string> = {
    FRONTEND: t("projectTypes.FRONTEND"),
    BACKEND: t("projectTypes.BACKEND"),
    MOBILE: t("projectTypes.MOBILE"),
    DESKTOP: t("projectTypes.DESKTOP"),
    CYBERSECURITY: t("projectTypes.CYBERSECURITY"),
    DEVOPS: t("projectTypes.DEVOPS"),
    SOFTSKILLS: t("projectTypes.SOFTSKILLS"),
    TOOLS: t("projectTypes.TOOLS"),
    ARCHITECTURE: t("projectTypes.ARCHITECTURE"),
    DATA: t("projectTypes.DATA"),
    QUALITY_DELIVERY: t("projectTypes.QUALITY_DELIVERY"),
  };
  const projectKinds: Record<string, string> = {
    PROFESSIONAL: t("kind.PROFESSIONAL"),
    PERSONAL: t("kind.PERSONAL"),
    LEARNING: t("kind.LEARNING"),
  };
  const timeline =
    project.startedAt || project.endedAt
      ? [
          project.startedAt ? formatDate(project.startedAt, locale) : null,
          project.endedAt ? formatDate(project.endedAt, locale) : t("present"),
        ]
          .filter((value): value is string => Boolean(value))
          .join(" – ")
      : null;
  const facts = [
    {
      label: t("role"),
      value: project.caseStudy.roleTitle || t("productEngineer"),
    },
    {
      label: t("projectType"),
      value: projectTypes[project.type] ?? project.type,
    },
    {
      label: t("category"),
      value: projectKinds[project.kind] ?? project.kind,
    },
    ...(timeline ? [{ label: t("timeline"), value: timeline }] : []),
  ];

  return (
    <>
      <div
        data-case-study-card
        data-case-study-preview
        className="b-card-glow bg-card border-border mt-10 w-full max-w-full min-w-0 overflow-hidden rounded-3xl border p-2 shadow-[0_1.875rem_3.75rem_-1.875rem_rgba(15,23,42,0.35)] sm:rounded-4xl sm:p-3"
      >
        {gallery && gallery.length > 1 ? (
          <div className="mb-3 px-1">
            <Tab
              currentTab={activeScreenIndex}
              setCurrentTab={setActiveScreenIndex}
              ariaLabel="Screens Gallery"
              tabId="project-screens"
            >
              {gallery.map((item, idx) => (
                <TabItem
                  key={item.image}
                  index={idx}
                  icon={resolveIcon(item.icon, LayoutGrid)}
                  title={item.title}
                />
              ))}
            </Tab>
          </div>
        ) : null}

        <div className="border-border w-full max-w-full min-w-0 overflow-hidden rounded-2xl border sm:rounded-3xl">
          <div className="bg-muted flex items-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3">
            <span className="bg-muted-foreground/30 size-2 rounded-full sm:size-2.5" />
            <span className="bg-muted-foreground/30 size-2 rounded-full sm:size-2.5" />
            <span className="bg-muted-foreground/30 size-2 rounded-full sm:size-2.5" />
            <span className="bg-background/80 text-muted-foreground ml-2 flex h-4 max-w-[10rem] flex-1 items-center truncate rounded px-2 text-[0.6875rem] sm:ml-3 sm:max-w-64">
              {currentTitle}
            </span>
          </div>
          <div className="bg-muted relative aspect-[2/1] w-full max-w-full min-w-0 overflow-hidden">
            {/* VIS fallback — always rendered underneath */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950"
              aria-hidden="true"
            >
              <div className="absolute inset-x-0 top-5 flex items-center justify-between px-8">
                <i className="h-3 w-16 rounded bg-white/90" />
                <span className="flex gap-4">
                  <i className="h-1.5 w-12 rounded bg-white/60" />
                  <i className="h-1.5 w-12 rounded bg-white/35" />
                  <i className="h-1.5 w-12 rounded bg-white/35" />
                  <i className="h-1.5 w-12 rounded bg-white/35" />
                </span>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <i className="h-7 w-72 max-w-[60%] rounded bg-white/90" />
                <i className="h-3 w-44 max-w-[40%] rounded bg-white/45" />
              </div>
              <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full border border-indigo-400/40" />
            </div>
            {/* Active image */}
            {currentImage ? (
              <MediaImage
                key={currentImage}
                src={currentImage}
                alt={
                  gallery?.[activeScreenIndex]
                    ? `${project.title} - ${currentTitle}`
                    : `${project.title} preview`
                }
                fill
                sizes="(max-width: 768px) 100vw, 1152px"
                loading="eager"
                className="object-cover object-center transition-opacity duration-300"
              />
            ) : null}
          </div>
        </div>

        {/* Multi-screen interactive thumbnails */}
        {gallery && gallery.length > 1 ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {gallery.map((item, idx) => {
              const isSelected = activeScreenIndex === idx;
              const title = item.title;
              const description = item.description;
              return (
                <button
                  key={item.image}
                  type="button"
                  onClick={() => setActiveScreenIndex(idx)}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-2xl border p-1 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 ring-primary/40 shadow-sm ring-1"
                      : "border-border hover:border-primary/40 bg-card hover:bg-muted/40",
                  )}
                >
                  <div className="bg-muted relative aspect-[2/1] w-full overflow-hidden rounded-xl">
                    <MediaImage
                      src={item.image}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 p-1.5">
                    <p
                      className={cn(
                        "truncate text-xs leading-tight font-bold",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-[0.6875rem]">
                      {description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div
        data-case-study-card
        data-case-study-facts
        className="b-card-glow bg-card border-border mt-5 w-full max-w-full min-w-0 overflow-hidden rounded-3xl border p-4 sm:rounded-4xl sm:p-6 md:p-7"
      >
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-muted-foreground text-sm">{fact.label}</dt>
              <dd className="text-foreground mt-1 leading-snug font-semibold">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="border-border mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
          <ul className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <SkillChip
                key={skill.title}
                title={skill.title}
                image={skill.image}
              />
            ))}
          </ul>
          <ProjectActions project={project} t={t} />
        </div>
      </div>
    </>
  );
}

function ProjectActions({
  project,
  t,
}: {
  project: ProjectCaseStudyViewProps["project"];
  t: ReturnType<typeof useTranslations<"main.portfolio.caseStudy">>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {project.websiteUrl ? (
        <a
          href={project.websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-card hover:bg-muted/80 text-foreground hover:text-primary border-border inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors"
        >
          <ExternalLink className="text-primary size-3.5" aria-hidden="true" />
          <span>{t("liveSite")}</span>
        </a>
      ) : null}
      {!project.isPrivate && project.githubUrl ? (
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-card hover:bg-muted/80 text-foreground hover:text-primary border-border inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors"
        >
          <GithubIcon className="text-primary size-3.5" aria-hidden="true" />
          <span>{t("viewSource")}</span>
        </a>
      ) : project.isPrivate ? (
        <span className="bg-card border-border text-muted-foreground inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium">
          <Lock className="size-3.5" aria-hidden="true" />
          <span>{t("privateRepository")}</span>
        </span>
      ) : null}
    </div>
  );
}
