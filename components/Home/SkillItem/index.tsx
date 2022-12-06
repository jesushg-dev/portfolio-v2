import React, { FC } from 'react';
import Image, { ImageLoaderProps } from 'next/image';

interface ISkillItemProps {
  image: string;
  title: string;
  description: string;
  wiki: string;
}

const myLoader = ({ src }: ImageLoaderProps) => {
  return `https://cdn.simpleicons.org/${src}`;
};

const SkillItem: FC<ISkillItemProps> = ({ image, title, description, wiki }) => {
  return (
    <a
      href={wiki}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center gap-4 rounded-lg bg-white p-4 shadow transition-all hover:shadow-lg ">
      <div className="relative min-h-[3rem] min-w-[3rem] rounded-full bg-gray-100">
        <Image width={48} height={48} src={image} loader={myLoader} alt={title} />
      </div>
      <div>
        <h2 className="space-y-1 text-2xl font-bold leading-none text-gray-900">
          <span className="block text-sm text-blue-700">{title}</span>
        </h2>
        <p className="text-justify text-sm text-gray-800 line-clamp-2">{description}</p>
      </div>
    </a>
  );
};

export default SkillItem;
