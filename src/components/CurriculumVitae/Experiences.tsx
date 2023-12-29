import React, { useCallback } from 'react';
import { MdAssignment } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import type { FC, ReactNode } from 'react';

import { useCvContext } from '@/hoc/CvContextProvider';

// types

interface IExperienceProps {}

const experiences = ['experience1', 'experience2', 'experience3', 'experience4'] as const;

const Experience: FC<IExperienceProps> = ({}) => {
  const t = useTranslations('curriculum');
  const { showSectionIcons } = useCvContext();

  const renderItems = useCallback((chunks: ReactNode) => <li className="">{chunks}.</li>, [t]);

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        {showSectionIcons && <MdAssignment className="text-xs" />}
        {t('header.experience')}
      </h5>

      {experiences.map((experience) => (
        <div className="mb-4" key={experience}>
          <h3 className="text-sm font-bold">{t(`experiences.${experience}.position`)}</h3>
          <h4 className="my-1 text-xs ">
            {t(`experiences.${experience}.company`)} · {t(`experiences.${experience}.dates`)}
          </h4>
          <ul className="pl-8 text-xs list-disc">
            {t.rich(`experiences.${experience}.responsibilities`, {
              item: renderItems,
            })}
          </ul>
        </div>
      ))}
    </>
  );
};

export default Experience;
