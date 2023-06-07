import React, { FC } from 'react';

import { MdAssignment } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface IExperienceProps {}

const experiences = ['experience1', 'experience2', 'experience3'];

const Experience: FC<IExperienceProps> = ({}) => {
  const t = useTranslations('curriculum');
  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-xs font-semibold">
        <MdAssignment className="text-black" />
        {t('header.experience')}
      </h5>

      {experiences.map((experience) => (
        <div className="m1-b  border-light-grey mb-2 border-b-2 pb-2 " key={experience}>
          <h3 className="text-sm font-bold">{t(`experiences.${experience}.position` as any)}</h3>
          <h4 className="my-1 text-xs font-semibold">
            {t(`experiences.${experience}.company` as any)} | {t(`experiences.${experience}.dates` as any)}
          </h4>
          <ul>
            {t.rich(`experiences.${experience}.responsibilities` as any, {
              item: (chunks) => (
                <div className="flex text-xs">
                  <p className="mr-1">-</p>
                  <p className="m-0">{chunks}</p>
                </div>
              ),
            })}
          </ul>
        </div>
      ))}
    </>
  );
};

export default Experience;
