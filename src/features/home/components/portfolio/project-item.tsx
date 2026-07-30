"use client";

import { useState, type FC } from "react";

import Image from "next/image";
import { AiFillGithub, AiFillEye } from "react-icons/ai";
import { FolderCode } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cloudinaryLoader } from "@/utils/tools/image";
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
  "flex h-8 w-8 items-center justify-center rounded-lg border border-primary-100/80 bg-background-100/90 text-primaryText-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600";

const PortfolioItem: FC<IPortfolioItemProps> = ({
  image,
  title,
  skills,
  githubUrl,
  websiteUrl,
  description,
  hook,
  slug,
  kind,
  caseStudyEnabled,
  isPrivate = false,
  urlName,
  sourceName,
  privateName,
  privateDescription,
  canSeeDemo,
  caseStudyLabel,
  kindLabels,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showGithub = !isPrivate && Boolean(githubUrl);
  const cardDescription = hook ?? description;
  const kindLabel = kind ? kindLabels[kind] : undefined;
  const showImageFallback = imageFailed || !image?.trim();

  return (
    <article className="group/card bg-background-50 border-primary-100/60 mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden">
        {showImageFallback ? (
          <div className="from-primary-500/15 via-background-100 to-primary-700/10 flex h-full w-full items-center justify-center bg-gradient-to-br p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <FolderCode className="text-primary-600/70 h-10 w-10" />
              <span className="text-primaryText-500 text-xs font-semibold tracking-wider uppercase">
                {title}
              </span>
            </div>
          </div>
        ) : (
          <Image
            src={image}
            loader={cloudinaryLoader}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.03]"
            onError={() => setImageFailed(true)}
          />
        )}

        {kindLabel ? (
          <span className="bg-background/90 text-foreground absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase shadow-md">
            {kindLabel}
          </span>
        ) : null}

        {isPrivate ? (
          <span
            title={websiteUrl ? canSeeDemo : privateDescription}
            className="bg-primary-600 absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase shadow-md"
          >
            {privateName}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-primaryText-500 text-lg leading-tight font-bold">
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
                  <AiFillEye className="text-primary-600 h-4 w-4" />
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
                  <AiFillGithub className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="text-primaryText-700 line-clamp-2 text-sm leading-relaxed">
          {cardDescription}
        </p>

        {skills && skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <li
                key={skill.title}
                className="bg-background-100/80 border-primary-100/80 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
              >
                <SkillIcon
                  image={skill.image}
                  title={skill.title}
                  className="h-3.5 w-3.5"
                />
                <span className="text-primaryText-700 text-[11px] font-medium capitalize">
                  {skill.title}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {caseStudyEnabled && slug ? (
          <Link
            href={{
              pathname: "/projects/[slug]",
              params: { slug },
            }}
            aria-label={`${caseStudyLabel}: ${title}`}
            className="text-primary-800 hover:text-primary-900 mt-auto text-sm font-medium transition-colors"
          >
            {caseStudyLabel} →
          </Link>
        ) : null}
      </div>
    </article>
  );
};

export default PortfolioItem;
