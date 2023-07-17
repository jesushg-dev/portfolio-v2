import React, { FC } from 'react';

import { MdInsights } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useCvContext } from '@/hoc/CvContextProvider';

interface IExperienceProps {}

const Experience: FC<IExperienceProps> = ({}) => {
  const t = useTranslations('curriculum');
  const { showSectionIcons } = useCvContext();

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        {showSectionIcons && <MdInsights className="text-xs" />}
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
