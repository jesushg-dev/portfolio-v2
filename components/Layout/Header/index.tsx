import React, { FC, useState } from 'react';

import Link from 'next/link';

import NavButton from './NavButton';
import ToolbarHeader from './ToolbarHeader';

import { useTranslations } from 'next-intl';
import useIsOnTop from '../../../hooks/useIsOnTop';

interface IHeaderProps {}

const Header: FC<IHeaderProps> = ({}) => {
  const isOnTop = useIsOnTop();
  const t = useTranslations('header');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    setIsMenuOpen(false);
  };

  const toogleOpen = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <>
      <header
        className={`fixed right-0 left-0 z-40 w-full transition-all duration-700 ${
          isOnTop
            ? 'top-5 bg-transparent text-white hover:text-blue-700'
            : 'top-0 bg-white bg-opacity-90 text-gray-900 shadow backdrop-blur-lg backdrop-filter hover:bg-opacity-100'
        }`}>
        <nav className="rounded border-gray-200 px-2 py-3">
          <div className="container mx-auto flex max-w-screen-xl flex-wrap items-center justify-between md:px-6 lg:px-8">
            <Link
              href="/"
              className={`text-2xl font-bold tracking-tighter ${
                isOnTop ? 'text-white' : 'text-blue-700'
              }  duration-600 transform transition ease-in-out`}>
              <span className="tracking-relaxed">Jehg</span>
            </Link>
            <ToolbarHeader open={isMenuOpen} toogleOpen={toogleOpen} />
            <div
              id="mobile-menu-language-select"
              className={`${
                isMenuOpen ? 'my-2 rounded bg-white pb-4 ' : 'hidden'
              } w-full items-center justify-between md:order-1 md:my-0 md:flex md:w-auto md:rounded-none md:bg-transparent md:pb-0`}>
              <ul className="mt-4 flex flex-col rounded-lg px-4 md:mt-0 md:flex-row md:space-x-4 md:border-0 md:text-sm md:font-medium ">
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
