import type { FC } from "react";

import Image from "next/image";
import { AiFillGithub, AiFillEye } from "react-icons/ai";

import { cn } from "@/lib/utils";
import { cloudinaryLoader, siLoader } from "@/utils/tools/image";
import { type ProjectType } from "@/utils/interfaces/types";

const PROFILE_PHOTO =
  "https://res.cloudinary.com/js-media/image/upload/v1750355900/portfolio/carnet/uefv0bzpwxnlrrniisba.webp";
const AUTHOR_NAME = "Jesús Hernández";

interface IPortfolioItemProps extends ProjectType {
  urlName: string;
  sourceName: string;
  canSeeDemo: string;
  privateName: string;
  privateDescription: string;
}

const PortfolioItem: FC<IPortfolioItemProps> = ({
  image,
  title,
  skills,
  githubUrl,
  websiteUrl,
  description,
  isPrivate = false,
  urlName,
  sourceName,
  privateName,
  privateDescription,
  canSeeDemo,
}) => {
  return (
    <div className="group/card mx-auto w-full max-w-sm">
      <div className="relative flex h-96 cursor-pointer flex-col justify-between overflow-hidden rounded-md p-4 shadow-xl">
        <Image
          src={image}
          loader={cloudinaryLoader}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/60 transition duration-300 group-hover/card:bg-black/80" />

        {isPrivate ? (
          <span
            title={websiteUrl ? canSeeDemo : privateDescription}
            className="whitespace-no-wrap absolute top-0 right-0 z-30 origin-bottom-left translate-x-1/3 -translate-y-full rotate-45 transform bg-blue-600 px-5 py-1 text-center text-xs tracking-wider text-white uppercase shadow-lg"
          >
            {privateName}
          </span>
        ) : null}

        <div className="relative z-10 flex flex-row items-center space-x-4">
          <Image
            src={PROFILE_PHOTO}
            alt={AUTHOR_NAME}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full border-2 border-white/80 object-cover"
          />
          <div className="flex flex-col">
            <p className="relative z-10 text-base font-normal text-gray-50">
              {AUTHOR_NAME}
            </p>
            <p className="text-sm text-gray-400">Developer</p>
          </div>
        </div>

        <div className="absolute inset-0 z-20 flex items-center justify-center px-4 pt-16 pb-32 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
          <div className="flex flex-col items-center gap-5">
            {(websiteUrl ?? (!isPrivate && githubUrl)) && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {websiteUrl ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-xs text-gray-50 backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <AiFillEye className="h-4 w-4" />
                    {urlName}
                  </a>
                ) : null}
                {!isPrivate && githubUrl ? (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-xs text-gray-50 backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <AiFillGithub className="h-4 w-4" />
                    {sourceName}
                  </a>
                ) : null}
              </div>
            )}

            {skills && skills.length > 0 ? (
              <div className="flex max-w-full flex-wrap items-center justify-center gap-4">
                {skills.map((skill) => (
                  <div
                    key={skill.title}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <Image
                      src={skill.image}
                      loader={siLoader}
                      alt={skill.title}
                      width={24}
                      height={24}
                      className="h-6 w-6"
                    />
                    <span className="text-center text-xs text-gray-300 capitalize">
                      {skill.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="relative z-10 text-xl font-bold text-gray-50 md:text-2xl">
            {title}
          </h3>
          <p
            className={cn(
              "relative z-10 mt-3 text-sm font-normal text-gray-50",
              "line-clamp-3",
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioItem;
