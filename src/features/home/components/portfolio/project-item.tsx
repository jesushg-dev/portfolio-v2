"use client";

import { useState, useCallback, type FC, type PointerEvent } from "react";
import { AiFillGithub, AiFillEye } from "react-icons/ai";
import { FolderCode, Zap } from "lucide-react";
// import { ArrowUpRight } from "lucide-react";
// import { Link } from "@/i18n/routing";

import { MediaImage } from "@/components/shared/media-image";
import { type ProjectType } from "@/utils/interfaces/types";
import SkillIcon from "@/features/home/components/skills/skill-icon";

interface IPortfolioItemProps extends ProjectType {
  urlName: string;
  sourceName: string;
  canSeeDemo: string;
  privateName: string;
  privateDescription: string;
  caseStudyLabel: string;
  kindLabels: Record<string, string>;
}

const actionButtonClass =
  "flex size-11 items-center justify-center rounded-xl border border-border bg-card/80 text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 shadow-2xs";

const PortfolioItem: FC<IPortfolioItemProps> = ({
  image,
  title,
  skills,
  githubUrl,
  websiteUrl,
  description,
  hook,
  kind,
  isPrivate = false,
  urlName,
  sourceName,
  privateName,
  privateDescription,
  canSeeDemo,
  kindLabels,
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

  return (
    <article
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        backgroundImage:
          "radial-gradient(circle 360px at var(--x, 100%) var(--y, 100%), color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)",
      }}
      className="group/card border-border/80 bg-card text-card-foreground hover:border-primary/40 relative flex h-full w-full flex-col overflow-hidden rounded-3xl border shadow-xs transition-all duration-300 hover:shadow-xl"
    >
      {/* Media screenshot container */}
      <div className="border-border/50 bg-muted/40 relative aspect-video overflow-hidden border-b">
        {showImageFallback ? (
          <div className="from-primary/10 via-background to-primary/5 flex h-full w-full items-center justify-center bg-linear-to-br p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <FolderCode className="text-primary/70 size-10" />
              <span className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                {title}
              </span>
            </div>
          </div>
        ) : (
          <>
            <MediaImage
              src={image}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover/card:scale-105"
              onError={() => setImageFailed(true)}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-40 transition-opacity group-hover/card:opacity-20"
            />
          </>
        )}

        {kindLabel ? (
          <span className="border-border/40 bg-card/90 text-foreground absolute top-3.5 left-3.5 z-10 rounded-full border px-3 py-1 text-sm font-bold tracking-wider uppercase shadow-xs backdrop-blur-md">
            {kindLabel}
          </span>
        ) : null}

        {isPrivate ? (
          <span
            title={websiteUrl ? canSeeDemo : privateDescription}
            className="bg-primary text-primary-foreground absolute top-3.5 right-3.5 z-10 rounded-full px-3 py-1 text-sm font-bold tracking-wider uppercase shadow-xs"
          >
            {privateName}
          </span>
        ) : null}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-foreground text-xl font-bold tracking-tight">
            {title}
          </h3>

          {(websiteUrl ?? showGithub) ? (
            <div className="flex shrink-0 gap-1.5">
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={`${urlName}: ${title}`}
                  aria-label={`${urlName}: ${title}`}
                  className={actionButtonClass}
                >
                  <AiFillEye className="text-primary size-4.5" />
                </a>
              ) : null}
              {showGithub && githubUrl ? (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={`${sourceName}: ${title}`}
                  aria-label={`${sourceName}: ${title}`}
                  className={actionButtonClass}
                >
                  <AiFillGithub className="size-4.5" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Business Impact Hook */}
        {hook ? (
          <div className="border-primary/20 bg-primary/10 text-primary mt-3.5 flex items-start gap-2.5 rounded-2xl border p-3 text-sm leading-snug font-semibold">
            <Zap className="fill-primary/20 text-primary mt-0.5 size-4 shrink-0" />
            <span className="line-clamp-2">{hook}</span>
          </div>
        ) : null}

        <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-relaxed">
          {description}
        </p>

        {skills && skills.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-2 pt-5">
            {skills.map((skill) => (
              <li
                key={skill.title}
                className="border-border/80 bg-muted/40 text-foreground inline-flex items-center gap-2 rounded-xl border py-1 pr-2.5 pl-1 text-sm font-medium"
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
          </ul>
        ) : null}

        {/* CTA Case Study Link with arrow animation (Disabled until case study feature is complete)
        {caseStudyEnabled && slug ? (
          <Link
            href={{
              pathname: "/projects/[slug]",
              params: { slug },
            }}
            aria-label={`${caseStudyLabel}: ${title}`}
            className="group/cta text-primary hover:text-primary/80 mt-auto inline-flex items-center gap-1 pt-2 text-[0.9rem] font-semibold transition-colors"
          >
            <span>{caseStudyLabel}</span>
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
          </Link>
        ) : null}
        */}
      </div>
    </article>
  );
};

export default PortfolioItem;
