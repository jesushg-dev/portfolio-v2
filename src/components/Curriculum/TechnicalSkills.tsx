import React, { FC } from 'react';

import { MdSettings } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface ITechnicalSkillsProps {}

const TechnicalSkills: FC<ITechnicalSkillsProps> = ({}) => {
  const t = useTranslations('curriculum');
  return (
    <>
      <h5 className="text-blue mb-1 mt-0 flex items-center gap-1 text-xs font-semibold">
        <MdSettings className="text-black" />
        {t('header.technicalSkills')}
      </h5>
      <div>
        <ul className="grid grid-cols-2 gap-1">
          {t.rich('skills.frontEnd', {
            item: (chunks) => (
              <li className="pad-0">
                <p className="text-xs">{chunks}</p>
              </li>
            ),
          })}
        </ul>
        <ul className="grid grid-cols-2 gap-1">
          {t.rich('skills.backEnd', {
            item: (chunks) => (
              <li className="pad-0">
                <p className="text-xs">{chunks}</p>
              </li>
            ),
          })}
        </ul>
        <ul className="grid grid-cols-2 gap-1">
          {t.rich('skills.database', {
            item: (chunks) => (
              <li className="pad-0">
                <p className="text-xs">{chunks}</p>
              </li>
            ),
          })}
        </ul>
        <ul className="grid grid-cols-2 gap-1">
          {t.rich('skills.tools', {
            item: (chunks) => (
              <li className="pad-0">
                <p className="text-xs">{chunks}</p>
              </li>
            ),
          })}
        </ul>
      </div>
    </>
  );
};

export default TechnicalSkills;
