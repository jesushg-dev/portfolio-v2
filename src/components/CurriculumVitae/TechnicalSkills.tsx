import React, { FC } from 'react';

import { ClientLocalSettingsIcon } from './ClientIcon';

import { useTranslations } from 'next-intl';

interface ITechnicalSkillsProps {}

const skillsSection = ['frontEnd', 'backEnd', 'database', 'tools'] as const;

const TechnicalSkills: FC<ITechnicalSkillsProps> = ({}) => {
  const t = useTranslations('curriculum');

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        <ClientLocalSettingsIcon />
        {t('header.technicalSkills')}
      </h5>
      {skillsSection.map((section) => (
        <div className="mb-4" key={section}>
          <p className="text-sm font-bold mb-2">{t(`header.skills.${section}`)}</p>

          <ul className="pl-6 text-xs list-disc grid grid-cols-2 gap-1 ">
            {t.rich(`skills.${section}`, {
              item: (chunks) => (
                <li>
                  <p>{chunks}</p>
                </li>
              ),
            })}
          </ul>
        </div>
      ))}
      <div className="mb-4">
        {skillsSection.map((section) => (
          <div key={section}></div>
        ))}
      </div>
    </>
  );
};

export default TechnicalSkills;
