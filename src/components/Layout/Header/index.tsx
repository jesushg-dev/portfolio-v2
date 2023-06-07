'use client';

import React, { FC, useState } from 'react';

import Link from 'next/link';

import NavButton from './NavButton';
import ToolbarHeader from './ToolbarHeader';
import ThemeSelector from './ThemeSelector';

import { useTranslations } from 'next-intl';
import useIsOnTop from '../../../hooks/useIsOnTop';

interface IHeaderProps {
  alwaysVisible?: boolean;
}

const Header: FC<IHeaderProps> = ({ alwaysVisible = false }) => {
  const isOnTop = useIsOnTop();
  const t = useTranslations('global.header');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

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

  const toogleMainOpen = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const toogleThemeOpen = () => {
    setIsThemeMenuOpen((prev) => !prev);
  };

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-40 w-full transition-all duration-700 print:hidden ${
          isOnTop && !alwaysVisible
            ? 'top-5 bg-transparent text-white'
            : 'top-0 bg-background-50 bg-opacity-90 text-primaryText-900 shadow backdrop-blur-lg backdrop-filter hover:bg-opacity-100'
        }`}>
        <ThemeSelector onChange={toogleThemeOpen} visible={isThemeMenuOpen} newLabel={t('tools.newThemeSoon')} />
        <nav className="rounded border-background-200 px-2 py-3">
          <div className="container mx-auto flex max-w-screen-xl flex-wrap items-center justify-between md:px-6 lg:px-8">
            <Link
              href="/"
              className={`group text-2xl font-bold tracking-tighter ${
                isOnTop && !alwaysVisible ? 'text-white' : 'text-primary-700'
              }  duration-600 transform transition ease-in-out`}>
              <span className="tracking-relaxed">
                Jehg{' '}
                <span
                  className={`tracking-relaxed ${
                    isOnTop && !alwaysVisible ? 'text-primary-500' : 'text-secondaryText-500 group-hover:text-white'
                  } `}>
                  .
                </span>
              </span>
            </Link>
            <ToolbarHeader {...{ isMenuOpen, isThemeMenuOpen, toogleMainOpen, toogleThemeOpen }} />
            <div
              id="mobile-menu-language-select"
              className={`${
                isMenuOpen ? 'my-2 rounded bg-background-50 pb-4 ' : 'hidden'
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
