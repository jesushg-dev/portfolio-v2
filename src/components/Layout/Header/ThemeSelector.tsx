import React, { FC } from 'react';

import { useThemeContext } from '../../../hoc/ThemeContextProvider';
import { RiSunLine, RiMoonLine, RiPaintBrushLine, RiCheckDoubleLine } from 'react-icons/ri';

import { ETheme } from '@/utils/constants/theme';
import type { ThemeType } from '@/hoc/ThemeContextProvider';

interface IThemeSelectorProps {
  visible: boolean;
  newLabel?: string;
  onChange?: (isDark: boolean, theme: string) => void;
}

const ThemeSelector: FC<IThemeSelectorProps> = ({ visible, newLabel, onChange }) => {
  const { theme, setTheme } = useThemeContext();
  if (!visible) return null;

  const onChangeTheme = (isDark: boolean, theme: ThemeType) => {
    setTheme(theme, isDark);
    onChange?.(isDark, theme);
  };

  return (
    <div className="relative mx-auto flex max-w-screen-xl justify-end px-4 pt-3 md:px-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start md:space-x-4 ">
        {/*<span className="inline-block rounded-full border border-primary-400 px-2 py-2 text-xs font-medium text-primary-800">
          {newLabel} <RiPaintBrushLine className="ml-1 inline-block" />
        </span>*/}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ThemeOption isDark={true} theme={ETheme.MAIN_DARK} onClick={onChangeTheme} currentTheme={theme} />
          <ThemeOption isDark={true} theme={ETheme.ORANGE_DARK} onClick={onChangeTheme} currentTheme={theme} />
          <ThemeOption isDark={false} theme={ETheme.MAIN_LIGHT} onClick={onChangeTheme} currentTheme={theme} />
          <ThemeOption isDark={false} theme={ETheme.MAIN_DARK} onClick={onChangeTheme} currentTheme={theme} />
        </div>
      </div>
    </div>
  );
};

interface IThemeOptionProps {
  theme: ThemeType;
  isDark: boolean;
  currentTheme?: string;
  onClick?: (isDark: boolean, theme: ThemeType) => void;
}

const ThemeOption: FC<IThemeOptionProps> = ({ isDark, theme, onClick, currentTheme }) => {
  return (
    <button type="button" onClick={onClick?.bind(null, isDark, theme)} className={'theme-' + theme + ` relative`}>
      <div className="h-8 w-8 rounded-full border-2 border-primary-500 bg-background-200 p-1 text-primary-500 hover:bg-background-400 hover:text-primary-600">
        {isDark ? (
          <RiMoonLine aria-hidden="true" className="h-5 w-5" />
        ) : (
          <RiSunLine aria-hidden="true" className="h-5 w-5" />
        )}
      </div>
      {currentTheme === theme && (
        <span className="absolute right-0 top-0 -mr-1 -mt-1 inline-flex items-center justify-center rounded-full bg-primary-500 px-1 py-1 text-xs font-medium leading-none text-primary-500">
          <span className="sr-only">Selected</span>
          <RiCheckDoubleLine className="h-2 w-2 text-primaryText-500" />
        </span>
      )}
    </button>
  );
};

export default ThemeSelector;
