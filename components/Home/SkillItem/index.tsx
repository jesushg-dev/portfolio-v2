import React, { FC } from 'react';
import Image, { ImageLoaderProps } from 'next/image';

interface ISkillItemProps {
  image: string;
  title: string;
  description: string;
  onClick?: () => void;
}

const siLoader = ({ src }: ImageLoaderProps) => {
  return `https://cdn.simpleicons.org/${src}`;
};

const SkillItem: FC<ISkillItemProps> = ({ image, title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col items-center gap-4 rounded-lg border border-blue-50 bg-white p-4 shadow-sm transition-transform hover:scale-110 hover:transform hover:shadow-lg">
      <div className="relative h-8 w-8 rounded-full bg-gray-100">
        <Image width={32} height={32} src={image} loader={siLoader} alt={title} />
      </div>
      <h2 className="text-center text-xs font-bold leading-none text-gray-700 group-hover:text-blue-700">{title}</h2>
      <p className="hidden text-justify text-sm text-gray-800">{description}</p>
    </button>
  );
};

export default SkillItem;
