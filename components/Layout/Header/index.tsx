import React, { FC } from 'react';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import useIsOnTop from '../../../hooks/useIsOnTop';

interface IHeaderProps {}

const Header: FC<IHeaderProps> = ({}) => {
  const t = useTranslations('header.menu');
  const isOnTop = useIsOnTop();

  return (
    <div
      className={`w-full fixed right-0 left-0 z-50 transition-all duration-700 ${
        isOnTop ? 'bg-transparent text-white top-5' : 'bg-white text-gray-700 top-0 shadow-md'
      }`}>
      <div className="flex flex-col max-w-screen-xl p-4 mx-auto md:items-center md:justify-between md:flex-row md:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between lg:justify-start">
          <Link
            href="/"
            className={`text-2xl font-bold tracking-tighter ${
              isOnTop ? 'text-white' : 'text-blue-600'
            } transition duration-500 ease-in-out transform tracking-relaxed`}>
            Jehg
          </Link>
          <button className="rounded-lg md:hidden focus:outline-none focus:shadow-outline">
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-8 h-8">
              <path
                x-show="!open"
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"
                clipRule="evenodd"></path>
              <path
                x-show="open"
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
                style={{
                  display: 'none',
                }}></path>
            </svg>
          </button>
        </div>
        <nav className="flex-col hidden md:flex md:justify-start md:flex-row">
          <ul className="space-y-2 list-none lg:space-y-0 lg:items-center lg:inline-flex">
            <li>
              <Link
                href="/"
                className="px-2 lg:px-6 py-4 text-sm border-b-2 border-transparent leading-[22px] md:px-3 hover:border-blue-600 hover:text-blue-500">
                {t('home')}
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="px-2 lg:px-6 py-4 text-sm border-b-2 border-transparent leading-[22px] md:px-3 hover:border-blue-600 hover:text-blue-500">
                {t('about')}
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="px-2 lg:px-6 py-4 text-sm border-b-2 border-transparent leading-[22px] md:px-3 hover:border-blue-600 hover:text-blue-500">
                {t('skills')}
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="px-2 lg:px-6 py-4 text-sm border-b-2 border-transparent leading-[22px] md:px-3 hover:border-blue-600 hover:text-blue-500">
                {t('portfolio')}
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="px-2 lg:px-6 py-4 text-sm border-b-2 border-transparent leading-[22px] md:px-3 hover:border-blue-600 hover:text-blue-500">
                {t('contact')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Header;
