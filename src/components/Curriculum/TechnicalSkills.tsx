import React, { FC } from 'react';

import { MdSettings } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useCvContext } from '@/hoc/CvContextProvider';

interface ITechnicalSkillsProps {}

const skillsSection = ['frontEnd', 'backEnd', 'database', 'tools'] as const;

const TechnicalSkills: FC<ITechnicalSkillsProps> = ({}) => {
  const t = useTranslations('curriculum');
  const { showSectionIcons } = useCvContext();

  return (
    <>
      <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
        {showSectionIcons && <MdSettings className="text-xs" />}
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
