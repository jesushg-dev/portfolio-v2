'use client';

import React, { FC, lazy, Suspense } from 'react';

import { useTranslations } from 'next-intl';

import Loading from '@/components/Common/Loading';
import { CvContextProvider } from '@/hoc/CvContextProvider';

const HeaderCV = lazy(() => import('./HeaderCV'));
const ContactMe = lazy(() => import('./ContactMe'));
const Languages = lazy(() => import('./Languages'));
const Education = lazy(() => import('./Education'));
const SoftSkills = lazy(() => import('./SoftSkills'));
const Experience = lazy(() => import('./Experiences'));
const TechnicalSkills = lazy(() => import('./TechnicalSkills'));
const AdditionalInformation = lazy(() => import('./AdditionalInformation'));
//const PersonalReferences = lazy(() => import('./m/PersonalReferences'));

interface ICurriculumVitaeProps {
    
}

const CurriculumVitae: FC<ICurriculumVitaeProps> = ({}) => {
  const t = useTranslations('curriculum');

  return (
    <Suspense fallback={<Loading />}>
      <CvContextProvider>
        <HeaderCV />
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
            {/**<PersonalReferences /> */}
          </div>
        </div>
      </CvContextProvider>
    </Suspense>
  );
};

export default CurriculumVitae;