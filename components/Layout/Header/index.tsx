import React, { FC, useState } from 'react';

import Link from 'next/link';

import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';

import { useTranslations } from 'next-intl';
import useIsOnTop from '../../../hooks/useIsOnTop';

interface IHeaderProps {}

const Header: FC<IHeaderProps> = ({}) => {
  const t = useTranslations('header');
  const isOnTop = useIsOnTop();
  const [open, setOpen] = useState(false);

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div
      className={`fixed right-0 left-0 z-50 w-full transition-all duration-700 ${
        isOnTop
          ? 'top-5 bg-transparent text-white'
          : 'top-0 bg-white bg-opacity-70 text-gray-900 shadow backdrop-blur-lg backdrop-filter hover:bg-opacity-100'
      }`}>
      <div className="mx-auto flex max-w-screen-xl flex-col py-1 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between lg:justify-start">
          <Link
            href="/"
            className={`text-2xl font-bold tracking-tighter ${
              isOnTop ? 'text-white' : 'text-blue-700'
            } tracking-relaxed duration-600 transform transition ease-in-out`}>
            Jehg
          </Link>
          <button
            type="button"
            className="pressable focus:shadow-outline rounded-lg text-2xl focus:outline-none md:hidden"
            title={open ? t('closeMenu') : t('openMenu')}
            onClick={() => setOpen(!open)}>
            {open ? <RiCloseLine /> : <RiMenu3Line />}
          </button>
        </div>
        <nav className="hidden flex-col md:flex md:flex-row md:justify-start">
          <ul className="list-none space-y-2 lg:inline-flex lg:items-center lg:space-y-0">
            <li>
              <button
                type="button"
                title={t('menu.skills')}
                onClick={handleScroll.bind(null, 'home')}
                className="border-b-2 border-transparent px-2 py-4 text-sm hover:border-blue-700 hover:text-blue-700 md:px-3 lg:px-6">
                {t('menu.home')}
              </button>
            </li>
            <li>
              <button
                type="button"
                title={t('menu.skills')}
                onClick={handleScroll.bind(null, 'about')}
                className="border-b-2 border-transparent px-2 py-4 text-sm hover:border-blue-700 hover:text-blue-700 md:px-3 lg:px-6">
                {t('menu.about')}
              </button>
            </li>
            <li>
              <button
                type="button"
                title={t('menu.skills')}
                onClick={handleScroll.bind(null, 'skills')}
                className="border-b-2 border-transparent px-2 py-4 text-sm hover:border-blue-700 hover:text-blue-700 md:px-3 lg:px-6">
                {t('menu.skills')}
              </button>
            </li>
            <li>
              <button
                type="button"
                title={t('menu.portfolio')}
                onClick={handleScroll.bind(null, 'portfolio')}
                className="border-b-2 border-transparent px-2 py-4 text-sm hover:border-blue-700 hover:text-blue-700 md:px-3 lg:px-6">
                {t('menu.portfolio')}
              </button>
            </li>
            <li>
              <button
                type="button"
                title={t('menu.contact')}
                onClick={handleScroll.bind(null, 'contact')}
                className="border-b-2 border-transparent px-2 py-4 text-sm hover:border-blue-700 hover:text-blue-700 md:px-3 lg:px-6">
                {t('menu.contact')}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Header;
