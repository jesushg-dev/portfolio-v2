import React, { FC, useState, useEffect, createContext, startTransition } from 'react';

export interface ITheme {
  theme: string;
  isDark: boolean;
}

interface IThemeContext extends ITheme {
  setTheme: (theme: string, isDark: boolean) => void;
}

// Create context with default theme

export const ThemeContext = createContext<IThemeContext>({
  isDark: false,
  theme: 'main-light',
  setTheme: () => {},
});

// Provider component that wraps app and makes theme object available

interface IThemeContextProviderProps {
  children: React.ReactNode;
}

const ThemeContextProvider: FC<IThemeContextProviderProps> = ({ children }) => {
  const [theme, setRawTheme] = useState<ITheme>({
    theme: 'main-light',
    isDark: false,
  });

  const setTheme = (theme: string, isDark: boolean) => {
    const root = document.documentElement;
    const colorMode = isDark ? 'dark' : 'light';

    root.removeAttribute('class');
    setRawTheme({ theme, isDark });
    root.classList.add('theme-' + theme);
    window.localStorage.setItem('theme', theme);
    window.localStorage.setItem('color-mode', colorMode);

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-color-mode', isDark ? 'dark' : 'light');
  };

  // this get the initial theme from local storage and set it to the state
  useEffect(() => {
    const initialTheme = window.localStorage.getItem('theme');
    const initialColorMode = window.localStorage.getItem('color-mode');
    startTransition(() => {
      setRawTheme({ theme: initialTheme || 'main-light', isDark: initialColorMode === 'dark' });
    });
  }, []);

  return <ThemeContext.Provider value={{ ...theme, setTheme }}>{children}</ThemeContext.Provider>;
};

// Custom hook that shorthands the context!

const useThemeContext = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};

export { useThemeContext };
export default ThemeContextProvider;
