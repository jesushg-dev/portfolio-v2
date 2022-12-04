import { useTranslations } from 'next-intl';
import React, { FC } from 'react';
import { FcLike } from 'react-icons/fc';

interface IFooterProps {}

const Footer: FC<IFooterProps> = ({}) => {
  const t = useTranslations('footer');

  return (
    <footer className="bg-black text-white py-4">
      <div className="container mx-auto px-4">
        <div className="-mx-4 flex flex-wrap justify-between">
          <div className="px-4 w-full text-center sm:w-auto sm:text-left text-sm">
            {t('title')}
            {Date().split(' ')[3]}
          </div>
          <div className="px-4 w-full text-center sm:w-auto sm:text-left text-sm sm:flex sm:items-center">
            {t('madeWith')} <FcLike className="mx-auto md:mx-1" /> {t('by')} Jesús Hernández
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
