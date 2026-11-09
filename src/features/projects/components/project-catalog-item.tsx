"use client";

import { useCallback, useMemo, useState, type FC } from "react";
import { ArrowUpRight } from "lucide-react";

import { MediaImage } from "@/components/shared/media-image";
import { Link } from "@/i18n/routing";
import SkillIcon from "@/features/home/components/skills/skill-icon";
import { cn } from "@/lib/utils";
import type { ProjectType } from "@/utils/interfaces/types";

export type ProjectCatalogItemData = Omit<ProjectType, "image"> & {
  image?: string | null;
};

export interface ProjectCatalogItemProps {
  project: ProjectCatalogItemData;
  onPreview?: (project: ProjectType) => void;
  readCaseStudyLabel?: string;
  kindLabel?: string;
  metaText?: string;
  isFeaturedHero?: boolean;
  showSkills?: boolean;
  showCaseStudyLink?: boolean;
}

export function getProjectInitials(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0 || !words[0]) return "P";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const PROJECT_GRADIENTS = [
  "linear-gradient(135deg, #0ea5e9, #1d4ed8)",
  "linear-gradient(135deg, #1e3a8a, #0b1220)",
  "linear-gradient(135deg, #7c3aed, #111827)",
  "linear-gradient(135deg, #16a34a, #14532d)",
  "linear-gradient(135deg, #059669, #0f766e)",
  "linear-gradient(135deg, #2563eb, #0b1220)",
  "linear-gradient(135deg, #ea580c, #7c2d12)",
  "linear-gradient(135deg, #db2777, #4c0519)",
  "linear-gradient(135deg, #0284c7, #083344)",
  "linear-gradient(135deg, #9333ea, #3b0764)",
  "linear-gradient(135deg, #4f46e5, #1e1b4b)",
  "linear-gradient(135deg, #d97706, #78350f)",
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getProjectGradient(title: string): string {
  const normalized = title.trim().toLowerCase();
  const hash = hashString(normalized);
  return PROJECT_GRADIENTS[hash % PROJECT_GRADIENTS.length];
}

interface ProjectThumbnailProps {
  image?: string | null;
  title: string;
  isFeaturedHero?: boolean;
  gradient: string;
  initials: string;
}

function ProjectThumbnail({
  image,
  title,
  isFeaturedHero = false,
  gradient,
  initials,
}: ProjectThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  if (image && !hasError) {
    return (
      <div className="border-border/80 bg-card group-hover:border-primary/50 relative aspect-video w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 group-hover:shadow-xl">
        <MediaImage
          src={image}
          alt={title}
          fill
          sizes={
            isFeaturedHero
              ? "(max-width: 768px) 100vw, 55vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={{ background: gradient }}
      className={cn(
        "relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl transition-all duration-500 ease-out group-hover:scale-[1.02]",
        isFeaturedHero
          ? "shadow-lg group-hover:shadow-2xl"
          : "shadow-sm group-hover:shadow-xl",
      )}
    >
      <div className="flex h-[60%] w-[64%] items-center justify-center rounded-xl bg-white/14 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-xs transition-transform duration-500 ease-out group-hover:scale-105">
        <span
          className={cn(
            "font-heading font-bold tracking-wider text-white select-none",
            isFeaturedHero
              ? "text-3xl sm:text-4xl lg:text-5xl"
              : "text-2xl sm:text-3xl",
          )}
        >
          {initials}
        </span>
      </div>
    </div>
  );
}

interface ProjectCatalogContentProps {
  image?: string | null;
  title: string;
  isFeaturedHero: boolean;
  gradient: string;
  initials: string;
  displayMeta: string;
  description: string;
  skills?: ProjectType["skills"];
  showSkills: boolean;
  hasCaseStudyLink: boolean;
  readCaseStudyLabel: string;
}

function ProjectCatalogContent({
  image,
  title,
  isFeaturedHero,
  gradient,
  initials,
  displayMeta,
  description,
  skills,
  showSkills,
  hasCaseStudyLink,
  readCaseStudyLabel,
}: ProjectCatalogContentProps) {
  return (
    <>
      {/* 16:9 Thumbnail (Real Image first, initials gradient as fallback) */}
      <ProjectThumbnail
        image={image}
        title={title}
        isFeaturedHero={isFeaturedHero}
        gradient={gradient}
        initials={initials}
      />

      {/* Info Column */}
      <div
        className={cn("flex flex-col", isFeaturedHero ? "justify-center" : "")}
      >
        {displayMeta ? (
          <p
            className={cn(
              "text-muted-foreground font-normal",
              isFeaturedHero ? "text-xs sm:text-sm" : "mt-4 text-xs sm:text-sm",
            )}
          >
            {displayMeta}
          </p>
        ) : null}

        <h3
          title={title}
          className={cn(
            "text-foreground group-hover:text-primary font-bold tracking-tight transition-colors",
            isFeaturedHero
              ? "mt-2 text-2xl leading-tight sm:text-3xl lg:text-4xl"
              : "mt-1 line-clamp-2 text-lg leading-snug font-semibold sm:text-xl",
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "text-muted-foreground leading-relaxed",
            isFeaturedHero
              ? "mt-3 line-clamp-4 text-base sm:text-lg"
              : "mt-2 line-clamp-2 text-sm",
          )}
        >
          {description}
        </p>

        {showSkills && skills && skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {skills.slice(0, 4).map((skill) => (
              <span
                key={skill.id}
                className="border-border/80 bg-muted/40 text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs"
              >
                <SkillIcon
                  image={skill.image}
                  title={skill.title}
                  tile
                  size="sm"
                  className="size-3.5 rounded-xs text-[0.625rem]"
                />
                <span>{skill.title}</span>
              </span>
            ))}
            {skills.length > 4 ? (
              <span className="text-muted-foreground/80 pl-0.5 text-xs">
                +{skills.length - 4}
              </span>
            ) : null}
          </div>
        ) : null}

        {hasCaseStudyLink ? (
          <div className="mt-auto pt-3.5">
            <span className="text-primary inline-flex min-h-11 items-center gap-1 py-3 text-sm font-medium transition-colors group-hover:underline">
              <span>{readCaseStudyLabel}</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </div>
        ) : null}
      </div>
    </>
  );
}

export const ProjectCatalogItem: FC<ProjectCatalogItemProps> = ({
  project,
  onPreview,
  readCaseStudyLabel = "Read case study",
  kindLabel,
  metaText,
  isFeaturedHero = false,
  showSkills = true,
  showCaseStudyLink = true,
}) => {
  const { title, description, skills, image, caseStudyEnabled, slug } = project;
  const hasCaseStudyLink = Boolean(
    showCaseStudyLink && caseStudyEnabled && slug,
  );

  const initials = useMemo(() => getProjectInitials(title), [title]);
  const gradient = useMemo(() => getProjectGradient(title), [title]);

  const handleCardClick = useCallback(() => {
    if (onPreview) {
      onPreview(project as ProjectType);
    }
  }, [onPreview, project]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick],
  );

  const displayMeta = useMemo(() => {
    if (metaText) return metaText;
    return kindLabel ?? "";
  }, [kindLabel, metaText]);

  const cardClassName = cn(
    "group focus-visible:ring-primary w-full text-left transition-all duration-300 focus-visible:ring-2 focus-visible:outline-hidden",
    isFeaturedHero
      ? "from-primary/20 via-foreground/[0.04] hover:border-primary/40 grid grid-cols-1 items-center gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br to-transparent p-5 shadow-xl sm:gap-10 sm:p-7 md:grid-cols-[1.3fr_1fr]"
      : "flex flex-col rounded-2xl hover:-translate-y-1",
  );

  if (hasCaseStudyLink && slug) {
    return (
      <article className="h-full w-full">
        <Link
          href={{
            pathname: "/projects/[slug]",
            params: { slug },
          }}
          className={cardClassName}
        >
          <ProjectCatalogContent
            image={image}
            title={title}
            isFeaturedHero={isFeaturedHero}
            gradient={gradient}
            initials={initials}
            displayMeta={displayMeta}
            description={description}
            skills={skills}
            showSkills={showSkills}
            hasCaseStudyLink={hasCaseStudyLink}
            readCaseStudyLabel={readCaseStudyLabel}
          />
        </Link>
      </article>
    );
  }

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(cardClassName, "cursor-pointer")}
    >
      <ProjectCatalogContent
        image={image}
        title={title}
        isFeaturedHero={isFeaturedHero}
        gradient={gradient}
        initials={initials}
        displayMeta={displayMeta}
        description={description}
        skills={skills}
        showSkills={showSkills}
        hasCaseStudyLink={hasCaseStudyLink}
        readCaseStudyLabel={readCaseStudyLabel}
      />
    </article>
  );
};
