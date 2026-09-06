import { ArrowRight, ExternalLink, Square } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AiFillGithub } from "react-icons/ai";

import CaseStudyReveal from "@/features/home/components/projects/case-study-reveal";
import { Link } from "@/i18n/routing";
import ProjectCoverImage from "./project-cover-image";
import SkillIcon from "@/features/home/components/skills/skill-icon";

interface ProjectCaseStudyViewProps {
  project: {
    slug: string | null;
    image: string;
    title: string;
    description: string;
    hook: string | null;
    challenge: string | null;
    approach: string | null;
    outcome: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
    isPrivate: boolean;
    type: string;
    kind: string;
    skills: {
      title: string;
      image: string;
    }[];
  };
  nextProject?: {
    slug: string;
    title: string;
  } | null;
}

function formatStackType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function ConnectionGraph({
  variant = "hero",
}: {
  variant?: "hero" | "banner";
}) {
  const isHero = variant === "hero";

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={isHero ? "0 0 800 340" : "0 0 800 450"}
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g
        stroke={
          isHero ? "color-mix(in srgb, var(--primary) 70%, white)" : "white"
        }
        strokeWidth="1"
        opacity={isHero ? 0.55 : 0.5}
      >
        {isHero ? (
          <>
            <path className="case-study-graph-line" d="M120,90 L260,150" />
            <path className="case-study-graph-line" d="M260,150 L420,80" />
            <path className="case-study-graph-line" d="M260,150 L340,240" />
            <path className="case-study-graph-line" d="M420,80 L560,150" />
            <path className="case-study-graph-line" d="M340,240 L520,260" />
            <path className="case-study-graph-line" d="M520,260 L640,190" />
            <path className="case-study-graph-line" d="M560,150 L640,190" />
          </>
        ) : (
          <>
            <path className="case-study-graph-line" d="M150,120 L340,90" />
            <path className="case-study-graph-line" d="M340,90 L520,180" />
            <path className="case-study-graph-line" d="M150,120 L260,260" />
            <path className="case-study-graph-line" d="M260,260 L440,320" />
            <path className="case-study-graph-line" d="M440,320 L620,260" />
            <path className="case-study-graph-line" d="M520,180 L620,260" />
            <path className="case-study-graph-line" d="M520,180 L660,120" />
          </>
        )}
      </g>
      <g
        fill={
          isHero ? "color-mix(in srgb, var(--primary) 55%, white)" : "white"
        }
      >
        {isHero ? (
          <>
            <circle className="case-study-node" cx="120" cy="90" r="3.5" />
            <circle className="case-study-node" cx="260" cy="150" r="4.5" />
            <circle className="case-study-node" cx="420" cy="80" r="3.5" />
            <circle className="case-study-node" cx="340" cy="240" r="3.5" />
            <circle className="case-study-node" cx="560" cy="150" r="4.5" />
            <circle className="case-study-node" cx="520" cy="260" r="3.5" />
            <circle className="case-study-node" cx="640" cy="190" r="4.5" />
          </>
        ) : (
          <>
            <circle className="case-study-node" cx="150" cy="120" r="4" />
            <circle className="case-study-node" cx="340" cy="90" r="4" />
            <circle className="case-study-node" cx="520" cy="180" r="5.5" />
            <circle className="case-study-node" cx="260" cy="260" r="4" />
            <circle className="case-study-node" cx="440" cy="320" r="4" />
            <circle className="case-study-node" cx="620" cy="260" r="5.5" />
            <circle className="case-study-node" cx="660" cy="120" r="4" />
          </>
        )}
      </g>
    </svg>
  );
}

function SpinningBadge({ label }: { label: string }) {
  const badgeText = `${label.toUpperCase()} • CASE STUDY • ${label.toUpperCase()} • CASE STUDY •`;
  const pathId = `caseStudyCirclePath-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="case-study-badge-spin absolute right-4 bottom-4 md:right-6 md:bottom-6">
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden>
        <circle
          cx="38"
          cy="38"
          r="36"
          fill="var(--card)"
          stroke="var(--border)"
        />
        <path
          id={pathId}
          d="M 38, 38 m -26, 0 a 26,26 0 1,1 52,0 a 26,26 0 1,1 -52,0"
          fill="none"
        />
        <text fontSize="8.2" fill="var(--muted-foreground)" letterSpacing="2">
          <textPath href={`#${pathId}`} startOffset="0%">
            {badgeText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

function CaseStudySection({
  title,
  content,
  bordered = false,
}: {
  title: string;
  content: string;
  bordered?: boolean;
}) {
  return (
    <CaseStudyReveal
      className={bordered ? "border-border border-t pt-10" : undefined}
    >
      <h2 className="text-foreground mb-4 text-2xl font-semibold">{title}</h2>
      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
        {content}
      </p>
    </CaseStudyReveal>
  );
}

export default async function ProjectCaseStudyView({
  project,
  nextProject,
}: ProjectCaseStudyViewProps) {
  const t = await getTranslations("main.portfolio");

  const heroImageUrl = project.image;
  const coverImageUrl = project.image;
  const summary = project.hook ?? project.description;

  const filterKey = project.type.toLowerCase() as
    "frontend" | "backend" | "mobile" | "desktop";
  const typeLabel = ["frontend", "backend", "mobile", "desktop"].includes(
    filterKey,
  )
    ? t(`filters.${filterKey}`)
    : formatStackType(project.type);

  const kindLabel = t(`kind.${project.kind}` as "kind.PROFESSIONAL");
  const stackLabel =
    project.skills.length > 0
      ? project.skills
          .slice(0, 3)
          .map((skill) => skill.title)
          .join(", ")
      : "—";

  const contentSections = [
    {
      key: "introduction",
      title: t("caseStudy.introduction"),
      value: project.description,
    },
    {
      key: "challenge",
      title: t("caseStudy.challenge"),
      value: project.challenge,
    },
    {
      key: "approach",
      title: t("caseStudy.approach"),
      value: project.approach,
    },
    {
      key: "outcome",
      title: t("caseStudy.outcome"),
      value: project.outcome,
    },
  ].filter((section) => Boolean(section.value));

  return (
    <article className="pb-0">
      <section className="mx-auto max-w-6xl px-4 pt-8 md:px-10 md:pt-14">
        <Link
          href={{
            pathname: "/",
            hash: "#portfolio",
          }}
          className="text-primary hover:text-primary/80 mb-8 inline-flex text-sm font-medium transition-colors"
        >
          ← {t("caseStudy.backToPortfolio")}
        </Link>

        <div className="grid items-start gap-10 md:grid-cols-2">
          <div>
            <div className="case-study-load-1 bg-card border-border mb-6 flex h-8 w-8 items-center justify-center rounded-md border">
              <span className="bg-muted-foreground/60 h-1.5 w-1.5 rounded-sm" />
            </div>
            <h1 className="case-study-load-2 text-foreground text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl">
              {project.title}
            </h1>
          </div>
          <div>
            <p className="case-study-load-3 text-muted-foreground max-w-md text-[15px] leading-relaxed">
              {summary}
            </p>
          </div>
        </div>

        <div className="case-study-load-img border-border relative mt-10 aspect-[21/9] overflow-hidden rounded-2xl border">
          <ProjectCoverImage
            src={heroImageUrl}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1152px"
            priority
            fallbackTitle={project.title}
          />
          <div className="hero-bg absolute inset-0 opacity-80 mix-blend-multiply" />
          <div className="case-study-grain absolute inset-0 opacity-20" />
          <ConnectionGraph variant="hero" />
          <SpinningBadge label={project.title} />
        </div>
      </section>

      <CaseStudyReveal className="mx-auto mt-10 max-w-6xl px-4 md:px-10">
        <div className="border-border bg-card flex flex-col gap-6 rounded-xl border px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground/80 mb-1">
                {t("caseStudy.projectType")}
              </p>
              <p className="text-foreground font-medium">{typeLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground/80 mb-1">
                {t("caseStudy.category")}
              </p>
              <p className="text-foreground font-medium">{kindLabel}</p>
            </div>
            <div className="col-span-2 md:col-span-2">
              <p className="text-muted-foreground/80 mb-1">
                {t("caseStudy.stack")}
              </p>
              <p className="text-foreground font-medium">{stackLabel}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {project.websiteUrl ? (
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="case-study-btn-glow bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium"
              >
                {t("actions.view")}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
            {!project.isPrivate && project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="case-study-btn-glow border-border bg-background/50 text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium"
              >
                <AiFillGithub className="h-3.5 w-3.5" aria-hidden />
                {t("actions.source")}
              </a>
            ) : project.isPrivate ? (
              <span className="border-border bg-background/50 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium">
                <Square className="h-3.5 w-3.5" aria-hidden />
                {t("private.title")}
              </span>
            ) : null}
          </div>
        </div>
      </CaseStudyReveal>

      <CaseStudyReveal className="mx-auto mt-8 max-w-6xl px-4 md:px-10">
        <div className="border-border relative aspect-[16/9] overflow-hidden rounded-2xl border md:aspect-[21/9]">
          <div className="from-background-200 to-background absolute inset-0 bg-gradient-to-br" />
          <div className="case-study-grain absolute inset-0 opacity-25" />

          <div
            className="case-study-float-1 border-border/40 bg-card absolute top-[18%] left-[8%] h-28 w-16 rounded-2xl border shadow-2xl md:h-40 md:w-24"
            style={{ "--case-study-r": "-14deg" } as Record<string, string>}
          />
          <div
            className="case-study-float-2 border-border/40 bg-card absolute top-[12%] right-[10%] h-28 w-16 rounded-2xl border shadow-2xl md:h-40 md:w-24"
            style={{ "--case-study-r": "12deg" } as Record<string, string>}
          />
          <div
            className="case-study-float-3 border-border/40 bg-card absolute right-[22%] bottom-[8%] h-24 w-14 rounded-2xl border shadow-2xl md:h-36 md:w-20"
            style={{ "--case-study-r": "8deg" } as Record<string, string>}
          />

          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="case-study-mockup-card border-border/60 relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl">
              <ProjectCoverImage
                src={coverImageUrl}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 768px"
                fallbackTitle={project.title}
              />
            </div>
          </div>
        </div>
      </CaseStudyReveal>

      <section id="work" className="border-border bg-muted/40 mt-20 border-t">
        <div className="mx-auto max-w-3xl space-y-20 px-4 py-20 md:px-10">
          {contentSections.map((section) => (
            <div key={section.key} className="space-y-8">
              <CaseStudySection
                title={section.title}
                content={section.value!}
                bordered={section.key === "outcome"}
              />

              {section.key === "introduction" && project.skills.length > 0 ? (
                <CaseStudyReveal className="case-study-mockup-wrap from-primary/10 to-secondary/20 rounded-2xl bg-gradient-to-br p-8 md:p-12">
                  <div className="mx-auto grid max-w-lg grid-cols-3 gap-4 md:gap-6">
                    {project.skills.slice(0, 3).map((skill) => (
                      <div
                        key={skill.title}
                        className="case-study-mockup-card bg-card flex aspect-[9/18] flex-col items-center rounded-xl p-3 shadow-xl"
                      >
                        <SkillIcon
                          image={skill.image}
                          title={skill.title}
                          className="mt-4 mb-3 h-7 w-7"
                        />
                        <p className="text-muted-foreground text-center text-[0.625rem] leading-tight font-semibold">
                          {skill.title}
                        </p>
                        <div className="mt-auto mb-2 w-full space-y-1.5">
                          <div className="bg-muted h-2 rounded" />
                          <div className="bg-muted/70 h-2 w-2/3 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CaseStudyReveal>
              ) : null}

              {section.key === "challenge" ? (
                <CaseStudyReveal className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(120deg, color-mix(in srgb, var(--primary) 65%, #38bdf8), color-mix(in srgb, var(--primary) 55%, #a855f7) 45%, color-mix(in srgb, var(--primary) 45%, #f43f5e) 75%, color-mix(in srgb, var(--secondary) 70%, #fbbf24))",
                    }}
                  />
                  <div className="absolute inset-0 bg-black/55" />
                  <ConnectionGraph variant="banner" />
                  <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                    <div>
                      <p className="text-xl font-semibold text-white md:text-2xl">
                        {t("caseStudy.visualTitle")}
                      </p>
                      <p className="mt-2 text-sm text-white/70">
                        {t("caseStudy.visualSubtitle")}
                      </p>
                    </div>
                  </div>
                </CaseStudyReveal>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {nextProject ? (
        <CaseStudyReveal className="border-border bg-muted/40 border-t py-20">
          <Link
            href={{
              pathname: "/projects/[slug]",
              params: { slug: nextProject.slug },
            }}
            className="group text-foreground mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 text-2xl font-semibold md:px-10 md:text-3xl"
          >
            {t("caseStudy.nextProject")}
            <ArrowRight
              className="case-study-arrow-hop h-6 w-6 md:h-7 md:w-7"
              aria-hidden
            />
          </Link>
        </CaseStudyReveal>
      ) : null}
    </article>
  );
}
