import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Lock } from "lucide-react";
import { AiFillGithub } from "react-icons/ai";

import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/shared/media-image";

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

function ProjectActions({
  project,
}: {
  project: ProjectCaseStudyViewProps["project"];
}) {
  const t = useTranslations("main.portfolio.caseStudy");

  return (
    <div className="flex flex-wrap gap-2">
      {project.websiteUrl ? (
        <Button
          variant="outline"
          size="sm"
          render={
            <a href={project.websiteUrl} target="_blank" rel="noreferrer" />
          }
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          <span>{t("liveSite")}</span>
        </Button>
      ) : null}
      {!project.isPrivate && project.githubUrl ? (
        <Button
          variant="outline"
          size="sm"
          render={
            <a href={project.githubUrl} target="_blank" rel="noreferrer" />
          }
        >
          <AiFillGithub className="size-3.5" aria-hidden="true" />
          <span>{t("viewSource")}</span>
        </Button>
      ) : project.isPrivate ? (
        <span className="bg-card border-border text-muted-foreground inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium">
          <Lock className="size-3.5" aria-hidden="true" />
          {t("privateRepository")}
        </span>
      ) : null}
    </div>
  );
}

export default function ProjectSnapshot({
  project,
}: {
  project: ProjectCaseStudyViewProps["project"];
}) {
  const locale = useLocale();
  const t = useTranslations("main.portfolio.caseStudy");
  const tPortfolio = useTranslations("main.portfolio");
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
    PROFESSIONAL: tPortfolio("kind.PROFESSIONAL"),
    PERSONAL: tPortfolio("kind.PERSONAL"),
    LEARNING: tPortfolio("kind.LEARNING"),
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
        className="b-card-glow bg-card border-border mt-10 rounded-4xl border p-3 shadow-[0_1.875rem_3.75rem_-1.875rem_rgba(15,23,42,0.35)]"
      >
        <div className="border-border overflow-hidden rounded-3xl border">
          <div className="bg-muted flex items-center gap-1.5 px-4 py-3">
            <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
            <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
            <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
            <span className="bg-background/80 ml-3 h-4 max-w-64 flex-1 rounded" />
          </div>
          <div className="bg-muted relative aspect-[2/1]">
            {/* VIS fallback — always rendered underneath, exactly as the HTML cover() function does */}
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
            {/* Real image on top — if it fails to load the VIS remains visible */}
            {project.image ? (
              <MediaImage
                src={project.image}
                alt={`${project.title} preview`}
                fill
                sizes="(max-width: 768px) 100vw, 1152px"
                loading="eager"
                className="object-cover object-top"
              />
            ) : null}
          </div>
        </div>
      </div>
      <div
        data-case-study-card
        data-case-study-facts
        className="b-card-glow bg-card border-border mt-5 rounded-4xl border p-6 md:p-7"
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
          <ProjectActions project={project} />
        </div>
      </div>
    </>
  );
}
