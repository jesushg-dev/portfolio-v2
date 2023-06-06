import React, { FC } from 'react';

import Image from 'next/image';

import { AiFillGithub, AiFillEye } from 'react-icons/ai';
import { cloudinaryLoader, siLoader } from '../../../utils/tools/medialoader';

import type { ProjectType } from '../../../utils/interfaces/types';

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
  type,
}) => {
  return (
    <div className="group relative h-60 max-w-sm overflow-hidden rounded bg-background-50 shadow-lg">
      <Image src={image} loader={cloudinaryLoader} alt="Portfolio Image" width={400} height={200} />
      <div className="absolute inset-x-0 bottom-0 bg-background-100 p-4 text-primaryText-700">
        <p className="mb-1 text-sm font-semibold">{title}</p>
        <p className="text-xs text-primaryText-500">{description}</p>
      </div>
      <div className="absolute inset-0 isolate z-20 flex flex-col bg-black bg-opacity-80 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex grow flex-col items-center justify-center gap-4 px-4">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="pressable rounded-md bg-primary-800 px-4 py-2 shadow-lg">
              <span className="flex items-center justify-center gap-2 text-xs text-secondaryText-50">
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
              className="pressable rounded-md bg-background-50 px-4 py-2 shadow-lg">
              <span className="text-primaryText flex items-center justify-center gap-2 text-xs">
                <AiFillGithub className="h-4 w-4" />
                {sourceName}
              </span>
            </a>
          )}
        </div>
        <div className="flex w-full gap-4 overflow-x-auto bg-background-100 px-4 py-5 text-primaryText-700">
          {skills?.map((skill) => (
            <div key={skill.title} className="flex flex-col items-center gap-2">
              <Image src={skill.image} loader={siLoader} alt={skill.title} width={20} height={20} />
              <span className="text-center text-sm capitalize">{skill.title}</span>
            </div>
          ))}
        </div>
      </div>
      {isPrivate && (
        <span
          title={websiteUrl ? canSeeDemo : privateDescription}
          className="whitespace-no-wrap absolute right-0 top-0 z-30 origin-bottom-left -translate-y-full translate-x-1/3 rotate-45 transform bg-primary-600 px-5 py-1 text-center text-xs uppercase tracking-wider text-secondaryText-50 shadow-lg">
          {privateName}
        </span>
      )}
    </div>
  );
};

export default PortfolioItem;
