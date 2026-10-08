"use client";

import {
  useState,
  useCallback,
  useMemo,
  type FC,
  type PointerEvent,
} from "react";
import { AiFillGithub, AiFillEye } from "react-icons/ai";
import { ArrowUpRight, Zap } from "lucide-react";

import { MediaImage } from "@/components/shared/media-image";
import { Link } from "@/i18n/routing";
import { type ProjectType } from "@/utils/interfaces/types";
import SkillIcon from "@/features/home/components/skills/skill-icon";

import { ProjectCoverMockup } from "./project-cover-mockup";

interface IPortfolioItemProps extends ProjectType {
  urlName: string;
  sourceName: string;
  canSeeDemo: string;
  privateName: string;
  privateDescription: string;
  caseStudyLabel: string;
  kindLabels: Record<string, string>;
}

const MAX_TECH = 4;

const actionButtonClass =
  "flex size-10 items-center justify-center rounded-xl border border-border bg-card/90 text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 shadow-2xs";

const PortfolioItem: FC<IPortfolioItemProps> = ({
  image,
  title,
  skills,
  githubUrl,
  websiteUrl,
  description,
  hook,
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
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showGithub = !isPrivate && Boolean(githubUrl);
  const kindLabel = kind ? kindLabels[kind] : undefined;
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

  const hookParts = useMemo(() => {
    if (!hook) return [];
    return hook
      .split("·")
      .map((part) => part.trim())
      .filter(Boolean);
  }, [hook]);

  const { shownSkills, restSkills } = useMemo(() => {
    if (!skills || skills.length === 0) {
      return { shownSkills: [], restSkills: [] };
    }
    return {
      shownSkills: skills.slice(0, MAX_TECH),
      restSkills: skills.slice(MAX_TECH),
    };
  }, [skills]);

  return (
    <article
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        backgroundImage:
          "radial-gradient(circle 22.5rem at var(--x, 100%) var(--y, 100%), color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)",
      }}
      className="group/card border-border/80 bg-card text-card-foreground hover:border-primary/40 relative flex h-full w-full flex-col overflow-hidden rounded-4xl border shadow-xs transition-all duration-300 hover:shadow-xl"
    >
      {/* Cover Media container */}
      <div className="border-border/60 relative aspect-video overflow-hidden border-b">
        {showImageFallback ? (
          <div className="absolute inset-0" aria-hidden="true">
            <ProjectCoverMockup type={type} title={title} slug={slug} />
          </div>
        ) : (
          <MediaImage
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
            onError={() => setImageFailed(true)}
          />
        )}

        {/* Top Badges */}
        {kindLabel ? (
          <span className="border-border/40 bg-card/90 text-foreground absolute top-4 left-4 z-10 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase shadow-xs backdrop-blur-md">
            {kindLabel}
          </span>
        ) : null}

        {isPrivate ? (
          <span
            title={websiteUrl ? canSeeDemo : privateDescription}
            className="bg-primary text-primary-foreground absolute top-4 right-4 z-10 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase shadow-xs"
          >
            {privateName}
          </span>
        ) : null}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-foreground text-xl font-bold tracking-tight">
          {title}
        </h3>

        {/* Key Results / Hook */}
        {hook ? (
          hookParts.length > 1 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Key results">
              {hookParts.map((part, index) => (
                <li
                  key={part}
                  className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs leading-none font-semibold"
                >
                  {index === 0 ? (
                    <Zap className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                  <span>{part}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-primary mt-4 flex items-start gap-2 text-sm leading-snug font-semibold">
              <Zap className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="line-clamp-2">{hook}</span>
            </p>
          )
        ) : null}

        {/* Description */}
        <p className="text-muted-foreground mt-4 line-clamp-3 text-sm leading-relaxed whitespace-pre-line">
          {description}
        </p>

        {/* Technologies Row (Max 4 + count) */}
        {skills && skills.length > 0 ? (
          <ul
            className="mt-auto flex flex-wrap gap-2 pt-5"
            aria-label="Technologies"
          >
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
            {restSkills.length > 0 ? (
              <li
                title={restSkills.map((s) => s.title).join(", ")}
                className="border-border bg-muted/50 text-muted-foreground flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold"
              >
                +{restSkills.length}
              </li>
            ) : null}
          </ul>
        ) : null}

        {/* Action Footer */}
        <div className="border-border mt-5 flex items-center justify-between gap-3 border-t pt-4">
          {caseStudyEnabled && slug ? (
            <Link
              href={{
                pathname: "/projects/[slug]",
                params: { slug },
              }}
              aria-label={`${caseStudyLabel}: ${title}`}
              className="text-primary hover:text-primary/80 group/cta focus-visible:after:ring-primary inline-flex items-center gap-2 text-sm font-bold transition-colors after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-4xl focus-visible:after:ring-2"
            >
              <span>{caseStudyLabel}</span>
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
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
    </article>
  );
};

export default PortfolioItem;
