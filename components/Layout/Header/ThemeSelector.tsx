import React, { FC } from 'react';

import { RiSunLine, RiMoonLine, RiPaintBrushLine } from 'react-icons/ri';

interface IThemeSelectorProps {
  visible: boolean;
  newLabel?: string;
}

const ThemeSelector: FC<IThemeSelectorProps> = ({ visible, newLabel }) => {
  if (!visible) return null;

  const onChangeTheme = (isDark: boolean, theme: string) => {
    //clear all theme classes
    document.documentElement.classList.remove('theme-main-dark');
    document.documentElement.classList.remove('theme-main-light');
    document.documentElement.classList.remove('theme-hacker-dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data', isDark ? 'dark' : 'light');
    //set color scheme
    document.documentElement.setAttribute('color-scheme', isDark ? 'dark' : 'light');
  };

  return (
    <div className="relative mx-auto flex max-w-screen-xl justify-end pt-3 md:px-6 lg:px-8">
      <div className="flex flex-wrap justify-center md:justify-start md:space-x-4">
        <span className="inline-block rounded-full border border-secondary-400 px-2 py-2 text-xs font-medium text-secondary-800">
          {newLabel} <RiPaintBrushLine className="ml-1 inline-block" />
        </span>
        <ThemeOption isDark={true} theme="theme-hacker-dark" onClick={onChangeTheme} />
        <ThemeOption isDark={true} theme="theme-main-dark" onClick={onChangeTheme} />
        <ThemeOption isDark={false} theme="theme-main-light" onClick={onChangeTheme} />
      </div>
    </div>
  );
};

interface IThemeOptionProps {
  theme: string;
  isDark: boolean;
  onClick?: (isDark: boolean, theme: string) => void;
}

const ThemeOption: FC<IThemeOptionProps> = ({ isDark, theme, onClick }) => {
  return (
    <button type="button" onClick={onClick?.bind(null, isDark, theme)} className={theme + ` mr-2 mb-2 md:mr-0 md:mb-0`}>
      <div className="h-8 w-8 rounded-full border-2 border-secondary-500 bg-background-200 p-1 text-secondary-500 hover:bg-background-400 hover:text-secondary-600">
        {isDark ? (
          <RiMoonLine aria-hidden="true" className="h-5 w-5" />
        ) : (
          <RiSunLine aria-hidden="true" className="h-5 w-5" />
        )}
      </div>
    </button>
  );
};

export default ThemeSelector;
