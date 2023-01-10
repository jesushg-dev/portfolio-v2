import React, { FC, useState } from 'react';

import Link from 'next/link';

import NavButton from './NavButton';
import ToolbarHeader from './ToolbarHeader';

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
    <>
      <header
        className={`fixed right-0 left-0 z-50 w-full transition-all duration-700 ${
          isOnTop
            ? 'top-5 bg-transparent text-white'
            : 'top-0 bg-white bg-opacity-70 text-gray-900 shadow backdrop-blur-lg backdrop-filter hover:bg-opacity-100'
        }`}>
        <nav className="rounded border-gray-200  px-2 py-2.5 ">
          <div className="container mx-auto flex max-w-screen-xl flex-wrap items-center justify-between md:px-6 lg:px-8">
            <Link
              href="/"
              className={`text-2xl font-bold tracking-tighter ${
                isOnTop ? 'text-white' : 'text-blue-700'
              }  duration-600 transform transition ease-in-out`}>
              <span className="tracking-relaxed">Jehg</span>
            </Link>
            <ToolbarHeader />
            <div
              id="mobile-menu-language-select"
              className="hidden w-full items-center justify-between md:order-1 md:flex md:w-auto">
              <ul className="mt-4 flex flex-col rounded-lg px-4 md:mt-0 md:flex-row md:space-x-8 md:border-0 md:text-sm md:font-medium ">
                <NavButton title={t('menu.home')} onClick={handleScroll.bind(null, 'home')} />
                <NavButton title={t('menu.about')} onClick={handleScroll.bind(null, 'about')} />
                <NavButton title={t('menu.skills')} onClick={handleScroll.bind(null, 'skills')} />
                <NavButton title={t('menu.portfolio')} onClick={handleScroll.bind(null, 'portfolio')} />
                <NavButton title={t('menu.contact')} onClick={handleScroll.bind(null, 'contact')} />
              </ul>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
