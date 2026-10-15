import { useTranslations } from "next-intl";

import CaseStudyNextProject from "./case-study-next-project";
import CaseStudyPageSectionView from "./case-study-page-section";
import CaseStudySidebar from "./case-study-sidebar";
import { CaseStudyProgressBar } from "./case-study-progress-bar";
import { CaseStudyGlowContainer } from "./case-study-glow-container";
import { BackToProjectsLink } from "./case-study-primitives";
import type {
  CaseStudyPageSection,
  ProjectCaseStudyViewProps,
} from "./case-study-view.types";
import ProjectSnapshot from "./project-snapshot";

export default function ProjectCaseStudyView({
  project,
  nextProject,
}: ProjectCaseStudyViewProps) {
  const t = useTranslations("main.portfolio");
  const content = project.caseStudy;

  const projectTypes: Record<string, string> = {
    FRONTEND: t("caseStudy.projectTypes.FRONTEND"),
    BACKEND: t("caseStudy.projectTypes.BACKEND"),
    MOBILE: t("caseStudy.projectTypes.MOBILE"),
    DESKTOP: t("caseStudy.projectTypes.DESKTOP"),
    CYBERSECURITY: t("caseStudy.projectTypes.CYBERSECURITY"),
    DEVOPS: t("caseStudy.projectTypes.DEVOPS"),
    SOFTSKILLS: t("caseStudy.projectTypes.SOFTSKILLS"),
    TOOLS: t("caseStudy.projectTypes.TOOLS"),
    ARCHITECTURE: t("caseStudy.projectTypes.ARCHITECTURE"),
    DATA: t("caseStudy.projectTypes.DATA"),
    QUALITY_DELIVERY: t("caseStudy.projectTypes.QUALITY_DELIVERY"),
  };
  const projectKinds: Record<string, string> = {
    PROFESSIONAL: t("kind.PROFESSIONAL"),
    PERSONAL: t("kind.PERSONAL"),
    LEARNING: t("kind.LEARNING"),
  };
  const statuses: Record<string, string> = {
    IN_PRODUCTION: t("caseStudy.statuses.IN_PRODUCTION"),
    MAINTENANCE: t("caseStudy.statuses.MAINTENANCE"),
    ARCHIVED: t("caseStudy.statuses.ARCHIVED"),
  };

  const pageSections = buildCaseStudyPageSections(project, t);

  const shortOnTimeSections = pageSections.filter((section) =>
    ["role", "decisions", "results"].includes(section.key),
  );
  const projectChips =
    content.chips.length > 0
      ? content.chips
      : [
          projectKinds[project.kind] ?? project.kind,
          projectTypes[project.type] ?? project.type,
          project.status
            ? (statuses[project.status] ?? project.status)
            : t("caseStudy.statuses.IN_PRODUCTION"),
        ];

  return (
    <CaseStudyGlowContainer className="mx-auto max-w-6xl px-5 pt-24 pb-24">
      <CaseStudyProgressBar />
      <div className="fade">
        <BackToProjectsLink />
        <header className="mt-8">
          <div className="flex flex-wrap gap-2">
            {projectChips.map((chip) => (
              <span
                key={chip}
                className="bg-primary/10 text-primary rounded-full px-3.5 py-1.5 text-xs font-bold"
              >
                {chip}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-5xl leading-[1.05] font-extrabold tracking-tight md:text-7xl">
            {project.title}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-xl leading-8">
            {project.description ?? project.hook}
          </p>
        </header>

        <ProjectSnapshot project={project} />

        <div className="mt-16 grid gap-12 lg:grid-cols-[13.125rem_minmax(0,1fr)]">
          <CaseStudySidebar sections={pageSections} />
          <div className="min-w-0 space-y-20">
            {pageSections.map((section, index) => (
              <CaseStudyPageSectionView
                key={section.key}
                entry={section}
                index={index}
                content={content}
                challenge={project.challenge}
                shortOnTimeSections={shortOnTimeSections}
              />
            ))}
          </div>
        </div>

        {nextProject ? (
          <CaseStudyNextProject nextProject={nextProject} />
        ) : null}
      </div>
    </CaseStudyGlowContainer>
  );
}

function buildCaseStudyPageSections(
  project: ProjectCaseStudyViewProps["project"],
  t: ReturnType<typeof useTranslations<"main.portfolio">>,
): CaseStudyPageSection[] {
  const content = project.caseStudy;
  const entries: CaseStudyPageSection[] = [];
  const navTitles: Record<string, string> = {
    summary: t("caseStudy.indexLabels.summary"),
    context: t("caseStudy.indexLabels.context"),
    role: t("caseStudy.indexLabels.role"),
    challenge: t("caseStudy.indexLabels.challenge"),
    decisions: t("caseStudy.indexLabels.decisions"),
    architecture: t("caseStudy.indexLabels.architecture"),
    "data-model": t("caseStudy.indexLabels.data"),
    capabilities: t("caseStudy.indexLabels.capabilities"),
    security: t("caseStudy.indexLabels.security"),
    quality: t("caseStudy.indexLabels.quality"),
    "design-system": t("caseStudy.indexLabels.designSystem"),
    results: t("caseStudy.indexLabels.results"),
  };

  if (content.tldr.length > 0) {
    entries.push({
      key: "summary",
      eyebrow: t("caseStudy.summaryEyebrow"),
      title: t("caseStudy.summaryTitle"),
      navTitle: navTitles.summary ?? "",
      kind: "SUMMARY",
    });
  }
  if (content.context) {
    entries.push({
      key: "context",
      eyebrow: t("caseStudy.context"),
      title: t("caseStudy.context"),
      navTitle: navTitles.context ?? "",
      kind: "CONTEXT",
    });
  }
  if (
    content.roleTitle ||
    content.roleIntro ||
    content.responsibilities.length > 0
  ) {
    entries.push({
      key: "role",
      eyebrow: t("caseStudy.ownership"),
      title: t("caseStudy.roleSectionTitle"),
      navTitle: navTitles.role ?? "",
      kind: "ROLE",
    });
  }
  if (project.challenge || content.constraints.length > 0) {
    entries.push({
      key: "challenge",
      eyebrow: t("caseStudy.challengeEyebrow"),
      title: t("caseStudy.challenge"),
      navTitle: navTitles.challenge ?? "",
      kind: "CHALLENGE",
    });
  }
  for (let index = 0; index < content.sections.length; index += 1) {
    const section = content.sections[index];
    if (!section) continue;
    const nextSection = content.sections[index + 1];
    const relatedSection =
      (section.key === "data-model" &&
        nextSection?.key === "data-model-numbers") ||
      (section.key === "results" && nextSection?.key === "scope")
        ? nextSection
        : undefined;

    entries.push({
      key: section.key,
      eyebrow: section.eyebrow,
      title: section.title,
      navTitle: navTitles[section.key] ?? section.title,
      kind: "CONTENT",
      section,
      ...(relatedSection ? { relatedSection } : {}),
      ...(section.key === "results"
        ? { introText: project.outcome ?? "" }
        : {}),
    });
    if (relatedSection) index += 1;
  }
  return entries;
}
