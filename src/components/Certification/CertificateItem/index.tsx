import React, { FC } from 'react';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

import { MdCalendarMonth, MdSchool, MdOutlinePin, MdRemoveRedEye } from 'react-icons/md';

import type { CertificateType } from '@/utils/interfaces/types';


const formatIssuedDate = (issuedDate: number | null) => {
  if (!issuedDate) return '';
  const date = new Date(issuedDate);
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  return `${month}, ${year}`;
};

const CertificateItem: FC<CertificateType> = ({ image, title, issuedDate, url = '', company, idCredential }) => {
  const t = useTranslations('certification');
  const issuedDateText = formatIssuedDate(issuedDate);

  return (
    <div className="group relative pb-1 transition-all lg:hover:!opacity-100 lg:group-hover/list:opacity-50 w-full h-full">
      <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-4 lg:block lg:group-hover:bg-background-600/50 lg:group-hover:bg-background-800 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg" />
      <article className="flex flex-col gap-3 w-full h-full">
        <div className="overflow-hidden rounded-[0.625rem] bg-white min-h-[12.5rem] max-h-[12.5rem] w-full relative">
          <a href={url || ''} target="_blank" rel="noopener noreferrer">
            <Image
              src={
                image ??
                'https://res.cloudinary.com/js-media/image/upload/v1691171515/portfolio/certificates/placeholder_tovcyh.webp'
              }
              width={352}
              height={264}
              alt={title}
              className="object-cover h-full w-full group-hover:scale-110 transition-all duration-500"
            />
          </a>
        </div>
        <div className="flex flex-col gap-1 items-start justify-between flex-grow z-10">
          <h5 className="md:font-semibold mb-0 hover:text-primary">
            <a href={url || ''} title={t('seeCertificate')} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          </h5>
          <div className="w-full flex gap-2 justify-between items-center">
            <div>
              <div className="flex items-center text-sm">
                {issuedDate && (
                  <div className="flex items-center" title={t('titles.date')}>
                    <MdCalendarMonth />
                    <p className="pl-2">{issuedDateText}</p>
                  </div>
                )}
                <div className="flex items-center pl-5" title={t('titles.institution')}>
                  <MdSchool /> <p className="pl-2"> {company}</p>
                </div>
              </div>
              {idCredential && (
                <div className="flex items-center" title={t('titles.idCredential')}>
                  <MdOutlinePin />
                  <p className="pl-2 text-xs">{idCredential}</p>
                </div>
              )}
            </div>
            {url && (
              <a
                href={url}
                title={t('seeCertificate')}
                target="_blank"
                rel="noreferrer"
                className="pressable rounded-md bg-primary-700 hover:bg-primary-800 px-4 py-2 shadow-lg">
                <span className="flex items-center justify-center gap-2 text-xs text-secondaryText-50 w-full text-center">
                  <MdRemoveRedEye className="h-4 w-4" />
                  {t('seeCertificate')}
                </span>
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default CertificateItem;
