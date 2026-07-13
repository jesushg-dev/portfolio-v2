"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";

import { type Locale } from "@/i18n/config";

interface CvEditorLocaleContextValue {
  editLocale: Locale;
  setEditLocale: (locale: Locale) => void;
  defaultLocale: Locale;
}

const CvEditorLocaleContext = createContext<CvEditorLocaleContextValue | null>(
  null,
);

export const CvEditorLocaleProvider: FC<{
  defaultLocale: Locale;
  children: ReactNode;
}> = ({ defaultLocale, children }) => {
  const [editLocale, setEditLocale] = useState<Locale>(defaultLocale);
  const [prevDefaultLocale, setPrevDefaultLocale] =
    useState<Locale>(defaultLocale);

  if (defaultLocale !== prevDefaultLocale) {
    setPrevDefaultLocale(defaultLocale);
    setEditLocale(defaultLocale);
  }

  const value = useMemo(
    () => ({ editLocale, setEditLocale, defaultLocale }),
    [editLocale, defaultLocale],
  );

  return (
    <CvEditorLocaleContext.Provider value={value}>
      {children}
    </CvEditorLocaleContext.Provider>
  );
};

export const useCvEditorLocale = () => useContext(CvEditorLocaleContext);
