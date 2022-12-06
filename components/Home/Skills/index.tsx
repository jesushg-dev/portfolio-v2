import React, { FC } from 'react';

import { useTranslations } from 'next-intl';

import SkillItem from '../SkillItem';

interface ISkillsProps {}

const Skills: FC<ISkillsProps> = ({}) => {
  const t = useTranslations('skills');

  return (
    <main className="mx-auto px-4 py-4 lg:container lg:px-20 lg:py-20">
      <h2 className="flex items-center justify-center border-b border-gray-200 py-6 font-bold text-blue-600 lg:justify-between">
        {t('title')}
      </h2>
      <section className="mt-8">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 17 }).map((_, i) => (
            <li key={i}>
              <SkillItem
                icon="logo-html"
                title="HTML"
                description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod."
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default Skills;
