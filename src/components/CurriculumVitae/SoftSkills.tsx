import React, { useCallback } from 'react';
import { MdInsights } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import type { FC, ReactNode } from 'react';

import { useCvContext } from '@/hoc/CvContextProvider';

// types

interface IExperienceProps {}

const Experience: FC<IExperienceProps> = ({}) => {
  const t = useTranslations('curriculum');
  const { showSectionIcons } = useCvContext();

  const renderItems = useCallback((chunks: ReactNode) => <li className="">{chunks}.</li>, [t]);

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        {showSectionIcons && <MdInsights className="text-xs" />}
        {t('header.personalSkills')}
      </h5>

      <div className="mb-4">
        <ul className="pl-8 text-xs list-disc">
          {t.rich('softSkills', {
            item: renderItems,
          })}
        </ul>
      </div>
    </>
  );
};

export default Experience;
