"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { FC, ReactNode } from "react";
import { useLocale } from "next-intl";

// Define the type for the context value
interface ICvContextValue {
  showSectionIcons: boolean;
  addSplashOfColor: boolean;
  showHeadshot: boolean;
  showVisualizations: boolean;
  toggleSectionIcons: () => void;
  toggleSplashOfColor: () => void;
  toggleHeadshot: () => void;
  toggleVisualizations: () => void;
}

// Create the context
const CvContext = createContext<ICvContextValue | undefined>(undefined);

interface ICvContextProviderProps {
  children: ReactNode;
}

// Create a provider component
export const CvContextProvider: FC<ICvContextProviderProps> = ({
  children,
}) => {
  // State variables
  const locale = useLocale();

  const [showHeadshot, setShowHeadshot] = useState(false);
  const [showSectionIcons, setShowSectionIcons] = useState(false);
  const [addSplashOfColor, setAddSplashOfColor] = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(false);

  useEffect(() => {
    const newShowHeadshot = locale === "es";
    setShowHeadshot(newShowHeadshot);
  }, [locale]);

  // useMemo to memoize the context value
  const contextValue = useMemo(() => {
    // Toggle functions
    const toggleSectionIcons = () => {
      setShowSectionIcons((prev) => !prev);
    };

    const toggleSplashOfColor = () => {
      setAddSplashOfColor((prev) => !prev);
    };

    const toggleHeadshot = () => {
      setShowHeadshot((prev) => !prev);
    };

    const toggleVisualizations = () => {
      setShowVisualizations((prev) => !prev);
    };

    return {
      showSectionIcons,
      addSplashOfColor,
      showHeadshot,
      showVisualizations,
      toggleSectionIcons,
      toggleSplashOfColor,
      toggleHeadshot,
      toggleVisualizations,
    };
  }, [showSectionIcons, addSplashOfColor, showHeadshot, showVisualizations]);

  // Render the provider with the context value and children components
  return (
    <CvContext.Provider value={contextValue}>{children}</CvContext.Provider>
  );
};

export const useCvContext = () => {
  const context = useContext(CvContext);
  if (context === undefined) {
    throw new Error("useCvContext must be used within a CvProvider");
  }
  return context;
};
