import React, { FC } from 'react';

import { MdInsights } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface IExperienceProps {}

const Experience: FC<IExperienceProps> = ({}) => {
  const t = useTranslations('curriculum');
  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-xs font-semibold">
        <MdInsights className="text-black" />
        {t('header.personalSkills')}
      </h5>

      <div className="grid grid-cols-2 gap-x-2">
        {t.rich('softSkills', {
          item: (chunks) => (
            <div className="flex text-xs">
              <p className="mr-1">-</p>
              <p className="m-0">{chunks}</p>
            </div>
          ),
        })}
      </div>
    </>
  );
};

export default Experience;
