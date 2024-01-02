'use client';

import React from 'react';
import type { FC } from 'react';
import { useTranslations } from 'next-intl';

import { CvContextProvider } from '@/hoc/CvContextProvider';

import HeaderCv from './HeaderCv';
import ContactMe from './ContactMe';
import Languages from './Languages';
import Education from './Education';
import SoftSkills from './SoftSkills';
import Experience from './Experiences';
import TechnicalSkills from './TechnicalSkills';
import AdditionalInformation from './AdditionalInformation';
//  import PersonalReferences from './PersonalReferences';

interface ICurriculumVitaeProps {}

const CurriculumVitae: FC<ICurriculumVitaeProps> = ({}) => {
  const t = useTranslations('curriculum');

  return (
    <CvContextProvider>
      <HeaderCv />
      <div className="grid grid-cols-1 sm:grid-cols-9 p-5 pb-10 ">
        <div className="sm:col-span-3">
          <ContactMe />
          <Education />
          <Languages />
          <TechnicalSkills />
        </div>
        <div className="col-span-1 w-full justify-center hidden sm:flex">
          <div className="h-full border-r w-[1px] " />
        </div>
        <div className="sm:col-span-5">
          <h5 className="text-blue mb-1 flex items-center gap-1 text-lg uppercase font-semibold text-cv tracking-tight">
            {t('header.aboutMe')}
          </h5>

          <div className="mb-4">
            <h3 className="text-xs">{t('aboutMe')}</h3>
          </div>

          <Experience />
          <SoftSkills />
          <AdditionalInformation />
        </div>
      </div>
    </CvContextProvider>
  );
};

export default CurriculumVitae;
