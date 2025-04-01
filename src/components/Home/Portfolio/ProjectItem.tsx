import type { FC } from "react";
import React from "react";
import Image from "next/image";
import { AiFillGithub, AiFillEye } from "react-icons/ai";
import { cloudinaryLoader, siLoader } from "@/utils/tools/image";
import { type ProjectType } from "@/utils/interfaces/types";

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
    <div className="group rounded-smbg-background-50 relative h-60 max-w-sm overflow-hidden shadow-lg">
      <Image
        src={image}
        loader={cloudinaryLoader}
        alt="Portfolio Image"
        width={400}
        height={200}
      />
      <div className="bg-background-100 text-primaryText-700 absolute inset-x-0 bottom-0 p-4">
        <p className="mb-1 text-sm font-semibold">{title}</p>
        <p className="text-primaryText-500 text-xs">{description}</p>
      </div>
      <div className="absolute inset-0 isolate z-20 flex flex-col bg-black/80 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex grow flex-col items-center justify-center gap-4 px-4">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="pressable bg-primary-800 rounded-md px-4 py-2 shadow-lg"
            >
              <span className="text-secondaryText-50 flex items-center justify-center gap-2 text-xs">
                <AiFillEye className="h-4 w-4" />
                {urlName}
              </span>
            </a>
          )}
          {!isPrivate && githubUrl && (
            <a
              target="_blank"
              rel="noreferrer"
              href={githubUrl}
              className="pressable bg-background-50 rounded-md px-4 py-2 shadow-lg"
            >
              <span className="text-primaryText-500 flex items-center justify-center gap-2 text-xs">
                <AiFillGithub className="h-4 w-4" />
                {sourceName}
              </span>
            </a>
          )}
        </div>
        <div className="bg-background-100 text-primaryText-700 flex w-full gap-4 overflow-x-auto px-4 py-5">
          {skills?.map((skill) => (
            <div key={skill.title} className="flex flex-col items-center gap-2">
              <Image
                src={skill.image}
                loader={siLoader}
                alt={skill.title}
                width={20}
                height={20}
              />
              <span className="text-center text-sm capitalize">
                {skill.title}
              </span>
            </div>
          ))}
        </div>
      </div>
      {isPrivate && (
        <span
          title={websiteUrl ? canSeeDemo : privateDescription}
          className="whitespace-no-wrap bg-primary-600 text-secondaryText-50 absolute top-0 right-0 z-30 origin-bottom-left translate-x-1/3 -translate-y-full rotate-45 transform px-5 py-1 text-center text-xs tracking-wider uppercase shadow-lg"
        >
          {privateName}
        </span>
      )}
    </div>
  );
};

export default PortfolioItem;
