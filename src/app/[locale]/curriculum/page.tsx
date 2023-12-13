'use client';

import React, { FC, lazy, Suspense, useRef } from 'react';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { FaDownload, FaHome } from 'react-icons/fa';

import Layout from '@/components/Layout';
import { CvContextProvider } from '@/hoc/CvContextProvider';

const HeaderCV = lazy(() => import('@/components/Curriculum/HeaderCV'));
const ContactMe = lazy(() => import('@/components/Curriculum/ContactMe'));
const Languages = lazy(() => import('@/components/Curriculum/Languages'));
const Education = lazy(() => import('@/components/Curriculum/Education'));
const Experience = lazy(() => import('@/components/Curriculum/Experiences'));
const TechnicalSkills = lazy(() => import('@/components/Curriculum/TechnicalSkills'));
const SoftSkills = lazy(() => import('@/components/Curriculum/SoftSkills'));
const AdditionalInformation = lazy(() => import('@/components/Curriculum/AdditionalInformation'));
//const PersonalReferences = lazy(() => import('@/components/Curriculum/PersonalReferences'));

interface ICvPageProps {
  params: {locale: string};
}

const CvPage: FC<ICvPageProps> = ({params}) => {

  // Enable static rendering
  unstable_setRequestLocale(params.locale);

  const t = useTranslations('curriculum');
  const elementRef = useRef<HTMLDivElement>(null);

  return (
    <CvContextProvider>
      <Suspense fallback={<div />}>
        <Layout headerAlwaysVisible={true}>
          <div className="max-w-3xl mx-auto">
            <div className="-mt-2 pt-24 print:hidden">
              <div className="md:max-w-letter flex justify-between gap-2 mx-4 md:mx-0">
                <Link
                  href="/"
                  className="pressable flex items-center gap-2 rounded-lg border border-primary-700 px-4 py-3 text-sm text-primary-700 shadow-lg hover:text-secondaryText-100 hover:bg-primary-800">
                  {t('actions.goBack')} <FaHome className="text-xs" />
                </Link>

                <a
                  href={t('downloadLink')}
                  download={`CV - Jesús Enmanuel Hernández González.pdf`}
                  className="pressable flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-3 text-sm text-secondaryText-100 shadow-lg hover:bg-primary-800">
                  {t('actions.download')} <FaDownload className="text-xs" />
                </a>
              </div>
            </div>
            <section
              ref={elementRef}
              className="page print:max-w-letter print:max-h-letter print:my-o lg:h-letter md:max-w-letter md:h-letter overflow-hidden bg-gray-100 print:mx-0 print:border-0 print:bg-white mb-0 sm:mb-6 my-6">
              <div style={{ opacity: 1 }} className="bg-white text-black">
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

                <div className="p-4 bg-cv">
                  <p className="text-white text-xs font-semibold">{t('codedWith')}</p>
                </div>
              </div>
            </section>
          </div>
        </Layout>
      </Suspense>
    </CvContextProvider>
  );
};

export default CvPage;
