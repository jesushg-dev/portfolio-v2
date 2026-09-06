"use client";

import { useState, type FC } from "react";
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

const linkButtonClass =
  "flex size-8.5 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95";

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
  const cardDescription = description;
  const kindLabel = kind ? kindLabels[kind] : undefined;
  const showImageFallback = imageFailed || !image?.trim();

  return (
    <article className="group/card border-border/60 bg-card text-card-foreground hover:border-primary/30 flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      {/* Image container with clean treatment & gradient overlay */}
      <div className="border-border/40 bg-muted/40 relative aspect-video overflow-hidden border-b">
        {showImageFallback ? (
          <div className="from-primary/15 via-background to-primary/10 flex h-full w-full items-center justify-center bg-linear-to-br p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <FolderCode className="text-primary/70 size-10" />
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
            {/* Subtle uniform lighting & gradient overlay */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-50 transition-opacity group-hover/card:opacity-30"
            />
          </>
        )}

        {kindLabel ? (
          <span className="bg-card/90 text-foreground border-border/60 absolute top-3 left-3 z-10 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase shadow-md backdrop-blur-md">
            {kindLabel}
          </span>
        ) : null}

        {isPrivate ? (
          <span
            title={websiteUrl ? canSeeDemo : privateDescription}
            className="bg-primary text-primary-foreground absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase shadow-md"
          >
            {privateName}
          </span>
        ) : null}
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-foreground text-base font-bold tracking-tight sm:text-lg">
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
                  className={linkButtonClass}
                >
                  <AiFillEye className="text-primary size-4" />
                </a>
              ) : null}
              {showGithub && githubUrl ? (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={`${sourceName}: ${title}`}
                  aria-label={`${sourceName}: ${title}`}
                  className={linkButtonClass}
                >
                  <AiFillGithub className="size-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Business Impact Metric / Hook */}
        {hook ? (
          <div className="border-primary/25 bg-primary/10 text-primary inline-flex w-full items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.725rem] font-semibold">
            <Zap className="fill-primary/20 text-primary mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2 leading-tight">{hook}</span>
          </div>
        ) : null}

        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed sm:text-sm">
          {cardDescription}
        </p>

        {skills && skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((skill) => (
              <li
                key={skill.title}
                className="bg-muted/50 border-border/50 text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
              >
                <SkillIcon
                  image={skill.image}
                  title={skill.title}
                  className="size-3.5"
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
