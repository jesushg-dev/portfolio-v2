'use client';

import React, { FC, lazy, useRef } from 'react';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FaDownload } from 'react-icons/fa';

import Layout from '@/components/Layout';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleDownloadPDF = () => {
    const element = elementRef.current;
    if (!element) return;

    html2canvas(element).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('document.pdf');
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout headerAlwaysVisible={true}>
      <div className="-mt-2 pt-24 print:hidden">
        <div className="md:max-w-letter mx-auto flex max-w-3xl justify-end gap-2">
          <button
            type="button"
            className="pressable flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-3 text-sm text-secondaryText-100 shadow-lg hover:bg-primary-800"
            onClick={handlePrint}>
            {t('actions.download')} <FaDownload className="text-xs" />
          </button>
        </div>
      </div>
      <section
        ref={elementRef}
        className="page print:max-w-letter print:max-h-letter print:my-o lg:h-letter md:max-w-letter md:h-letter mx-auto  my-auto max-w-3xl overflow-hidden rounded-2xl border-4 border-gray-700 bg-gray-100 print:mx-0 print:border-0 print:bg-white lg:my-6">
        <div style={{ opacity: 1 }} className="bg-white p-5 pb-10 text-black">
          <div className="border-light-grey mb-3 flex items-center border-b-2 pb-2">
            <div className="mr-2 table">
              <div className="overflow-hidden rounded bg-primary-500">
                <Image
                  alt="Jesús Hernández photo"
                  loading="lazy"
                  width={110}
                  height={110}
                  decoding="async"
                  src="https://res.cloudinary.com/js-media/image/upload/v1670269379/portfolio/carnet/jesus-hernandez.webp"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex">
                <h1 className="text-2xl font-bold">
                  Jesús Enmanuel Hernández González{' '}
                  <span className="ml-0.5 hidden text-2xl font-bold text-primary-500 opacity-[1px]">*</span>
                </h1>
              </div>
              <h3 className="text-sm font-semibold">www.jesushg.com | jess232016@gmail.com</h3>
              <p className="text-xs">{t('aboutMe')}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
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
  );
};

export default CvPage;
