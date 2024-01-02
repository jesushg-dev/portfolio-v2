import React from 'react';
import type { FC } from 'react';
import { useTranslations } from 'next-intl';

import ClientImage from './ClientImage';

interface IHeaderCVProps {}

const HeaderCV: FC<IHeaderCVProps> = ({}) => {
  const t = useTranslations('curriculum');

  return (
    <div className="flex flex-col sm:flex-row items-center border-b-2 p-5 py-7 gap-4 text-white bg-cv">
      <ClientImage />
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
