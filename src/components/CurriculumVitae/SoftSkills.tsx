import React, { FC } from 'react';

import { useTranslations } from 'next-intl';

import { ClientLocalInsightsIcon } from './ClientIcon';

interface IExperienceProps {}

const Experience: FC<IExperienceProps> = ({}) => {
  const t = useTranslations('curriculum');

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        <ClientLocalInsightsIcon />
        {t('header.personalSkills')}
      </h5>

      <div className="mb-4">
        <ul className="pl-8 text-xs list-disc">
          {t.rich('softSkills', {
            item: (chunks) => <li className="">{chunks}.</li>,
          })}
        </ul>
      </div>
    </>
  );
};

export default Experience;
