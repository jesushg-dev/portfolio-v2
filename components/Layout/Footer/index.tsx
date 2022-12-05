import React, { FC } from 'react';
import { useTranslations } from 'next-intl';

import { FcLike } from 'react-icons/fc';

interface IFooterProps {}

const Footer: FC<IFooterProps> = ({}) => {
  const t = useTranslations('footer');

  return (
    <footer className="bg-black py-4 text-white">
      <div className="container mx-auto px-4">
        <div className="-mx-4 flex flex-wrap justify-between">
          <div className="w-full px-4 text-center text-sm sm:w-auto sm:text-left">
            {t('title')}
            {Date().split(' ')[3]}
          </div>
          <div className="w-full px-4 text-center text-sm sm:flex sm:w-auto sm:items-center sm:text-left">
            {t('madeWith')} <FcLike className="mx-auto md:mx-1" /> {t('by')} Jesús Hernández
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
