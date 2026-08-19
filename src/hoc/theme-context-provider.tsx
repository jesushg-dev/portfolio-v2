"use client";

import {
  useState,
  useMemo,
  useEffect,
  createContext,
  startTransition,
  type ReactNode,
  useContext,
  useCallback,
} from "react";
import type { FC } from "react";

import { ETheme } from "@/utils/constants/theme";

export type ThemeType = ETheme;

export interface ITheme {
  theme: ThemeType;
  isDark: boolean;
}

interface IThemeContext extends ITheme {
  isCustomActive: boolean;
  setTheme: (theme: ThemeType, isDark: boolean) => void;
  saveCustomTheme: (colors: {
    primary?: string;
    secondary?: string;
    background?: string;
    card?: string;
    foreground?: string;
    border?: string;
  }) => void;
  clearCustomTheme: () => void;
  activateCustomTheme: () => void;
}

// Create context with default theme
const ThemeContext = createContext<IThemeContext>({
  isDark: false,
  theme: ETheme.MAIN_LIGHT,
  isCustomActive: false,
  setTheme: () => {
    console.warn("setTheme is called outside of a ThemeContextProvider.");
  },
  saveCustomTheme: () => {
    console.warn(
      "saveCustomTheme is called outside of a ThemeContextProvider.",
    );
  },
  clearCustomTheme: () => {
    console.warn(
      "clearCustomTheme is called outside of a ThemeContextProvider.",
    );
  },
  activateCustomTheme: () => {
    console.warn(
      "activateCustomTheme is called outside of a ThemeContextProvider.",
    );
  },
});

// Provider component that wraps app and makes theme object available

interface IThemeContextProviderProps {
  children: ReactNode;
}

const ThemeContextProvider: FC<IThemeContextProviderProps> = ({ children }) => {
  const [theme, setRawTheme] = useState<ITheme>({
    theme: ETheme.MAIN_LIGHT,
    isDark: false,
  });
  const [isCustomActive, setIsCustomActive] = useState<boolean>(false);

  const setTheme = useCallback((newTheme: ThemeType, isDark: boolean) => {
    const root = document.documentElement;
    const colorMode = isDark ? "dark" : "light";

    root.style.removeProperty("--primary");
    root.style.removeProperty("--secondary");
    root.style.removeProperty("--background");
    root.style.removeProperty("--card");
    root.style.removeProperty("--foreground");
    root.style.removeProperty("--border");
    window.localStorage.setItem("custom-theme-active", "false");
    setIsCustomActive(false);

    root.removeAttribute("class");
    setRawTheme({ theme: newTheme, isDark });
    root.classList.add(`theme-${newTheme}`);
    window.localStorage.setItem("theme", newTheme);
    window.localStorage.setItem("color-mode", colorMode);

    root.setAttribute("data-theme", newTheme);
    root.setAttribute("data-color-mode", colorMode);
  }, []);

  const saveCustomTheme = useCallback(
    (colors: {
      primary?: string;
      secondary?: string;
      background?: string;
      card?: string;
      foreground?: string;
      border?: string;
    }) => {
      const root = document.documentElement;
      window.localStorage.setItem("custom-theme-active", "true");
      setIsCustomActive(true);

      if (colors.primary) {
        window.localStorage.setItem("custom-theme-primary", colors.primary);
        root.style.setProperty("--primary", colors.primary);
      }
      if (colors.secondary) {
        window.localStorage.setItem("custom-theme-secondary", colors.secondary);
        root.style.setProperty("--secondary", colors.secondary);
      }
      if (colors.background) {
        window.localStorage.setItem(
          "custom-theme-background",
          colors.background,
        );
        root.style.setProperty("--background", colors.background);
      }
      if (colors.card) {
        window.localStorage.setItem("custom-theme-card", colors.card);
        root.style.setProperty("--card", colors.card);
      }
      if (colors.foreground) {
        window.localStorage.setItem(
          "custom-theme-foreground",
          colors.foreground,
        );
        root.style.setProperty("--foreground", colors.foreground);
      }
      if (colors.border) {
        window.localStorage.setItem("custom-theme-border", colors.border);
        root.style.setProperty("--border", colors.border);
      }
    },
    [],
  );

  const clearCustomTheme = useCallback(() => {
    const root = document.documentElement;
    window.localStorage.setItem("custom-theme-active", "false");
    setIsCustomActive(false);

    root.style.removeProperty("--primary");
    root.style.removeProperty("--secondary");
    root.style.removeProperty("--background");
    root.style.removeProperty("--card");
    root.style.removeProperty("--foreground");
    root.style.removeProperty("--border");

    window.localStorage.removeItem("custom-theme-primary");
    window.localStorage.removeItem("custom-theme-secondary");
    window.localStorage.removeItem("custom-theme-background");
    window.localStorage.removeItem("custom-theme-card");
    window.localStorage.removeItem("custom-theme-foreground");
    window.localStorage.removeItem("custom-theme-border");
  }, []);

  const activateCustomTheme = useCallback(() => {
    const root = document.documentElement;
    window.localStorage.setItem("custom-theme-active", "true");
    setIsCustomActive(true);

    const p = window.localStorage.getItem("custom-theme-primary");
    const s = window.localStorage.getItem("custom-theme-secondary");
    const bg = window.localStorage.getItem("custom-theme-background");
    const cd = window.localStorage.getItem("custom-theme-card");
    const fg = window.localStorage.getItem("custom-theme-foreground");
    const bd = window.localStorage.getItem("custom-theme-border");

    if (p) root.style.setProperty("--primary", p);
    if (s) root.style.setProperty("--secondary", s);
    if (bg) root.style.setProperty("--background", bg);
    if (cd) root.style.setProperty("--card", cd);
    if (fg) root.style.setProperty("--foreground", fg);
    if (bd) root.style.setProperty("--border", bd);
  }, []);

  // this get the initial theme from local storage and set it to the state
  useEffect(() => {
    const initialTheme = window.localStorage.getItem("theme") as ThemeType;
    const initialColorMode = window.localStorage.getItem("color-mode");
    const customActive =
      window.localStorage.getItem("custom-theme-active") === "true";

    startTransition(() => {
      setTheme(initialTheme ?? "main-light", initialColorMode === "dark");
      if (customActive) {
        setIsCustomActive(true);
        const root = document.documentElement;
        const p = window.localStorage.getItem("custom-theme-primary");
        const s = window.localStorage.getItem("custom-theme-secondary");
        const bg = window.localStorage.getItem("custom-theme-background");
        const cd = window.localStorage.getItem("custom-theme-card");
        const fg = window.localStorage.getItem("custom-theme-foreground");
        const bd = window.localStorage.getItem("custom-theme-border");
        if (p) root.style.setProperty("--primary", p);
        if (s) root.style.setProperty("--secondary", s);
        if (bg) root.style.setProperty("--background", bg);
        if (cd) root.style.setProperty("--card", cd);
        if (fg) root.style.setProperty("--foreground", fg);
        if (bd) root.style.setProperty("--border", bd);
      }
    });
  }, [setTheme]);

  // useMemo to memoize the context value
  const contextValue = useMemo(
    () => ({
      ...theme,
      isCustomActive,
      setTheme,
      saveCustomTheme,
      clearCustomTheme,
      activateCustomTheme,
    }),
    [
      theme,
      isCustomActive,
      setTheme,
      saveCustomTheme,
      clearCustomTheme,
      activateCustomTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook that shorthands the context!

const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      "useThemeContext must be used within a ThemeContextProvider",
    );
  }
  return context;
};

export { useThemeContext };
export default ThemeContextProvider;
