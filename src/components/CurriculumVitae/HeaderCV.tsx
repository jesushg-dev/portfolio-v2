import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { FC } from 'react';

import { useCvContext } from '@/hoc/CvContextProvider';

// types

interface IHeaderCVProps {}

const HeaderCV: FC<IHeaderCVProps> = ({}) => {
  const t = useTranslations('curriculum');
  const { showHeadshot } = useCvContext();

  return (
    <div className="flex flex-col sm:flex-row items-center border-b-2 p-5 py-7 gap-4 text-white bg-cv">
      {showHeadshot && (
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
      )}
      <div className="flex flex-col justify-center items-center sm:items-start">
        <h1 className="text-2xl font-bold">
          {t('degree')}
          <span className="ml-0.5 hidden text-2xl font-bold  opacity-[1px]">*</span>
        </h1>
        <h2 className="text-sm font-semibold">Jesús Enmanuel Hernández González</h2>
      </div>
    </div>
  );
};

export default HeaderCV;
