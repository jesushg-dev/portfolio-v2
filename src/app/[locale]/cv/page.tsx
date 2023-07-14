'use client';

import React, { FC, lazy, useRef } from 'react';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FaDownload } from 'react-icons/fa';

import Layout from '@/components/Layout';

import { CvContextProvider } from '@/hoc/CvContextProvider';

const Education = lazy(() => import('@/components/Curriculum/Education'));
const Experience = lazy(() => import('@/components/Curriculum/Experiences'));
const TechnicalSkills = lazy(() => import('@/components/Curriculum/TechnicalSkills'));
const SoftSkills = lazy(() => import('@/components/Curriculum/SoftSkills'));
const AdditionalInformation = lazy(() => import('@/components/Curriculum/AdditionalInformation'));
const PersonalReferences = lazy(() => import('@/components/Curriculum/PersonalReferences'));

interface ICvPageProps {}

const CvPage: FC<ICvPageProps> = ({}) => {
  const t = useTranslations('curriculum');
  const elementRef = useRef<HTMLDivElement>(null);

  return (
    <CvContextProvider>
      <Layout headerAlwaysVisible={true}>
        <div className="-mt-2 pt-24 print:hidden">
          <div className="md:max-w-letter mx-auto flex max-w-3xl justify-end gap-2">
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
          className="page print:max-w-letter print:max-h-letter print:my-o lg:h-letter md:max-w-letter md:h-letter mx-auto  my-auto max-w-3xl overflow-hidden bg-gray-100 print:mx-0 print:border-0 print:bg-white lg:my-6">
          <div style={{ opacity: 1 }} className="bg-white text-black">
            <div
              className="flex items-center border-b-2 p-5 py-7 text-white"
              style={{
                backgroundColor: '#2F528F',
              }}>
              <div className="mx-5 table">
                <div className="overflow-hidden bg-white shadow-lg">
                  <Image
                    alt="Jesús Hernández photo"
                    loading="lazy"
                    width={100}
                    height={150}
                    decoding="async"
                    src="https://res.cloudinary.com/js-media/image/upload/v1687726418/portfolio/carnet/jesus-hernandez.crop_xqewhg.webp"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex">
                  <h1 className="text-2xl font-bold">
                    {t('degree')}
                    <span className="ml-0.5 hidden text-2xl font-bold  opacity-[1px]">*</span>
                  </h1>
                </div>
                <h2 className="text-sm font-semibold">Jesús Enmanuel Hernández González</h2>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 p-5 pb-10">
              <div className="col-span-1">
                <TechnicalSkills />
                <Education />
                <p className="text-blue mt-2 text-xs font-semibold">{t('codedWith')}</p>
              </div>
              <div className="col-span-3">
                <Experience />
                <SoftSkills />
                <AdditionalInformation />
                <PersonalReferences />
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </CvContextProvider>
  );
};

export default CvPage;
