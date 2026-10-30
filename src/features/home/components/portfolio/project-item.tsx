"use client";

import { useState, useCallback, type FC, type PointerEvent } from "react";
import { AiFillGithub, AiFillEye } from "react-icons/ai";
import { ArrowUpRight } from "lucide-react";

import { MediaImage } from "@/components/shared/media-image";
import { Link } from "@/i18n/routing";
import { type ProjectType } from "@/utils/interfaces/types";
import SkillIcon from "@/features/home/components/skills/skill-icon";

import { ProjectCoverMockup } from "./project-cover-mockup";

export interface ProjectMetaLabels {
  solo: string;
  team: string;
  now: string;
  statuses: Record<string, string>;
}

export interface ProjectTeaserLabels {
  decisions: string;
  layers: string;
  metrics: string;
}

export interface IPortfolioItemProps extends Omit<ProjectType, "csInfo"> {
  csInfo?: { decisions: number; layers: boolean; metrics: number } | null;
  urlName: string;
  sourceName: string;
  canSeeDemo: string;
  privateName: string;
  privateDescription: string;
  caseStudyLabel: string;
  kindLabels: Record<string, string>;
  metaLabels?: ProjectMetaLabels;
  teaserLabels?: ProjectTeaserLabels;
  priority?: boolean;
}

const MAX_TECH = 5;

const actionButtonClass =
  "flex size-10 items-center justify-center rounded-xl border border-border bg-card/90 text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 shadow-2xs";

interface ProjectMetaLineProps {
  teamSize?: number | null;
  startedAt?: string | null;
  endedAt?: string | null;
  status?: string | null;
  metaLabels?: ProjectMetaLabels;
}

export function ProjectMetaLine({
  teamSize,
  startedAt,
  endedAt,
  status,
  metaLabels,
}: ProjectMetaLineProps) {
  if (!metaLabels) return null;

  const parts: string[] = [];

  if (typeof teamSize === "number" && teamSize > 0) {
    parts.push(teamSize === 1 ? metaLabels.solo : metaLabels.team);
  }

  if (startedAt) {
    const startYear = startedAt.slice(0, 4);
    if (endedAt) {
      const endYear = endedAt.slice(0, 4);
      parts.push(startYear === endYear ? startYear : `${startYear}–${endYear}`);
    } else {
      parts.push(`${startYear}–${metaLabels.now}`);
    }
  }

  if (status && metaLabels.statuses[status]) {
    parts.push(metaLabels.statuses[status]);
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-muted-foreground mt-1.5 text-sm">{parts.join(" · ")}</p>
  );
}

interface ProjectTeaserLineProps {
  caseStudyEnabled?: boolean;
  csInfo?: { decisions: number; layers: boolean; metrics: number } | null;
  teaserLabels?: ProjectTeaserLabels;
}

export function ProjectTeaserLine({
  caseStudyEnabled,
  csInfo,
  teaserLabels,
}: ProjectTeaserLineProps) {
  if (!caseStudyEnabled || !csInfo || !teaserLabels) return null;

  const parts: string[] = [];

  if (csInfo.decisions > 0) {
    parts.push(teaserLabels.decisions);
  }
  if (csInfo.layers) {
    parts.push(teaserLabels.layers);
  }
  if (csInfo.metrics > 0) {
    parts.push(teaserLabels.metrics);
  }

  if (parts.length === 0) return null;

  const text = parts.join(" · ");
  return (
    <p className="text-muted-foreground mb-3 truncate text-sm" title={text}>
      {text}
    </p>
  );
}

export function ProjectHighlights({ highlights }: { highlights: string[] }) {
  if (highlights.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Project highlights">
      {highlights.map((highlight, index) => (
        <li
          key={`${index}-${highlight}`}
          title={highlight}
          className="bg-primary/10 text-primary max-w-full min-w-0 rounded-full px-3 py-1.5 text-xs leading-none font-semibold"
        >
          <span className="truncate">{highlight}</span>
        </li>
      ))}
    </ul>
  );
}

interface ProjectTechRowProps {
  skills?: ProjectType["skills"];
}

export function ProjectTechRow({ skills }: ProjectTechRowProps) {
  if (!skills || skills.length === 0) return null;

  const shownSkills = skills.slice(0, MAX_TECH);
  const restCount = skills.length - MAX_TECH;

  return (
    <ul className="mt-auto flex flex-wrap gap-2 pt-5" aria-label="Technologies">
      {shownSkills.map((skill) => (
        <li
          key={skill.title}
          className="border-border bg-muted/50 text-foreground flex items-center gap-1.5 rounded-lg border py-1 pr-2.5 pl-1 text-xs font-medium"
        >
          <SkillIcon
            image={skill.image}
            title={skill.title}
            tile
            size="sm"
            className="size-6 rounded-lg text-xs"
          />
          <span className="capitalize">{skill.title}</span>
        </li>
      ))}
      {restCount > 0 ? (
        <li
          title={skills
            .slice(MAX_TECH)
            .map((s) => s.title)
            .join(", ")}
          className="border-border bg-muted/50 text-muted-foreground flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold"
        >
          +{restCount}
        </li>
      ) : null}
    </ul>
  );
}

const PortfolioItem: FC<IPortfolioItemProps> = ({
  image,
  title,
  skills,
  githubUrl,
  websiteUrl,
  description,
  highlights = [],
  kind,
  type,
  isPrivate = false,
  urlName,
  sourceName,
  privateName,
  privateDescription,
  canSeeDemo,
  caseStudyLabel,
  kindLabels,
  caseStudyEnabled,
  slug,
  status,
  startedAt,
  endedAt,
  teamSize,
  csInfo,
  metaLabels,
  teaserLabels,
  priority = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showGithub = !isPrivate && Boolean(githubUrl);
  const effectiveKind = kind ?? "PERSONAL";
  const kindLabel =
    kindLabels[effectiveKind] ?? (kind ? kindLabels[kind] : undefined);
  const showImageFallback = imageFailed || !image?.trim();

  const handlePointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  }, []);

  const handlePointerLeave = useCallback((e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--x");
    e.currentTarget.style.removeProperty("--y");
  }, []);

  return (
    <article
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        backgroundImage:
          "radial-gradient(circle 22.5rem at var(--x, 100%) var(--y, 100%), color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)",
      }}
      className="group/card border-border bg-card text-card-foreground hover:border-primary/50 relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] border shadow-xs transition-all duration-300 hover:shadow-xl"
    >
      {/* Cover Media container */}
      <div className="border-border relative aspect-video overflow-hidden border-b">
        {showImageFallback ? (
          <div
            className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/card:scale-105"
            aria-hidden="true"
          >
            <ProjectCoverMockup type={type} title={title} slug={slug} />
          </div>
        ) : (
          <MediaImage
            src={image}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/card:scale-105"
            onError={() => setImageFailed(true)}
          />
        )}

        {/* Top Badges */}
        {kindLabel ? (
          <span className="border-border/40 bg-card/95 text-foreground ring-foreground/10 absolute top-4 left-4 z-10 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase shadow-xs ring-1 backdrop-blur-md">
            {kindLabel}
          </span>
        ) : null}

        {isPrivate ? (
          <span
            title={websiteUrl ? canSeeDemo : privateDescription}
            className="bg-primary text-primary-foreground absolute top-4 right-4 z-10 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase shadow-xs"
          >
            {privateName}
          </span>
        ) : null}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3
          className="text-foreground line-clamp-2 text-xl font-bold tracking-tight"
          title={title}
        >
          {title}
        </h3>

        <ProjectMetaLine
          teamSize={teamSize}
          startedAt={startedAt}
          endedAt={endedAt}
          status={status}
          metaLabels={metaLabels}
        />

        <ProjectHighlights highlights={highlights} />
        <p className="text-muted-foreground mt-4 line-clamp-3 text-sm leading-relaxed whitespace-pre-line">
          {description}
        </p>

        <ProjectTechRow skills={skills} />

        {/* Action Footer */}
        <div className="border-border mt-5 border-t pt-4">
          <ProjectTeaserLine
            caseStudyEnabled={caseStudyEnabled}
            csInfo={csInfo}
            teaserLabels={teaserLabels}
          />
          <div className="flex items-center justify-between gap-3">
            {caseStudyEnabled && slug ? (
              <Link
                href={{
                  pathname: "/projects/[slug]",
                  params: { slug },
                }}
                aria-label={`${caseStudyLabel}: ${title}`}
                className="text-primary hover:text-primary/80 group/cta focus-visible:after:ring-primary inline-flex items-center gap-2 text-sm font-bold transition-colors after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-[2rem] focus-visible:after:ring-2"
              >
                <span>{caseStudyLabel}</span>
                <ArrowUpRight
                  className="size-4 transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : showGithub ? (
              <a
                href={githubUrl!}
                target="_blank"
                rel="noreferrer"
                aria-label={`${sourceName}: ${title}`}
                className="text-foreground hover:text-primary relative z-10 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                <AiFillGithub className="size-4" aria-hidden="true" />
                <span>{sourceName}</span>
              </a>
            ) : websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${urlName}: ${title}`}
                className="text-primary hover:text-primary/80 relative z-10 inline-flex items-center gap-2 text-sm font-bold transition-colors"
              >
                <span>{urlName}</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            ) : (
              <span />
            )}

            {/* Secondary Action Buttons */}
            <div className="relative z-10 flex items-center gap-2">
              {caseStudyEnabled && slug && showGithub ? (
                <a
                  href={githubUrl!}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${sourceName}: ${title}`}
                  title={`${sourceName}: ${title}`}
                  className={actionButtonClass}
                >
                  <AiFillGithub className="size-4.5" aria-hidden="true" />
                </a>
              ) : null}
              {caseStudyEnabled && slug && websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${urlName}: ${title}`}
                  title={`${urlName}: ${title}`}
                  className={actionButtonClass}
                >
                  <AiFillEye
                    className="text-primary size-4.5"
                    aria-hidden="true"
                  />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PortfolioItem;
