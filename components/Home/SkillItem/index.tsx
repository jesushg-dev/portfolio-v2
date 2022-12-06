import React, { FC } from 'react';

interface ISkillItemProps {
  icon: string;
  title: string;
  description: string;
}

const SkillItem: FC<ISkillItemProps> = ({ icon, title, description }) => (
  <div className=" flex w-full gap-4 rounded-lg bg-white p-4 shadow transition-all hover:shadow-lg ">
    <div className="h-12 w-12 rounded-full bg-gray-100">
      <svg className="h-12 w-12">
        <use xlinkHref="./img/svg-symbols.svg#logo-html" />
      </svg>
    </div>
    <div>
      <h2 className="space-y-1 text-2xl font-bold leading-none text-gray-900">
        <span className="block text-sm text-blue-700">{title}</span>
      </h2>
      <p className="text-justify text-sm text-gray-800 line-clamp-2">{description}</p>
    </div>
  </div>
);

export default SkillItem;
